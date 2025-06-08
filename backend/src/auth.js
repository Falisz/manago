//BACKEND/auth.js
const { sql, poolPromise } = require('./db');

async function findUser(username) {
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input('username', sql.VarChar, username)
        .query('SELECT id, username, password, role, active FROM Users WHERE username = @username');

    return result.recordset[0] || null;
}

async function validateUser(user, password, allowedRoles) {
    if (!user) {
        return { valid: false, status: 401, message: 'Invalid credentials!' };
    }
    if (!user.active) {
        return { valid: false, status: 403, message: 'User inactive.' };
    }
    if (password !== user.password) {
        return { valid: false, status: 401, message: 'Invalid credentials, wrong password!' };
    }
    if (!allowedRoles.includes(user.role)) {
        return { valid: false, status: 403, message: 'You do not have permission to log in to this portal.' };
    }

    return { valid: true };
}

function serializeUser(user) {
    return {
        id: user.id,
        username: user.username,
        role: user.role,
        manager_nav_collapsed: user.manager_nav_collapsed
    };
}

async function checkAccess(req, allowedRoles) {
    if (!req.session) {
        return {access: false, user: null, status: 401, message: 'No session found.'};
    }

    const user = req.session.user;
    if (!user) {
        return {access: false, user: null, status: 401, message: 'No user found.'};
    }

    const pool = await poolPromise;
    const result = await pool
        .request()
        .input('userID', sql.Int, user.id)
        .query('SELECT username, role, active, manager_nav_collapsed FROM Users WHERE id = @userID');

    if (!result.recordset[0]) {
        return {access: false, user: null, status: 401, message: 'No user.'};
    }

    const userResult = result.recordset[0]
    if (!allowedRoles.includes(userResult.role) || !userResult.active) {
        return {access: false, user: userResult, status: 403, message: 'Access denied.'};
    }

    return {access: true, user: userResult, status: 200, message: 'Authorization successfully!'};
}

function logoutUser(req, res) {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid', { path: '/', sameSite: 'lax', httpOnly: true });
        res.json({ message: 'Logged out' });
    });
}

module.exports = {
    findUser,
    validateUser,
    serializeUser,
    checkAccess,
    logoutUser,
};

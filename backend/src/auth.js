//BACKEND/auth.js
const { sql, poolPromise } = require('./db');

async function authUser(username, password) {
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input('username', sql.VarChar, username)
        .query('SELECT * FROM Users WHERE username = @username');

    const user = result.recordset[0] || null;

    if (!user) {
        return { valid: false, status: 401, message: 'Invalid credentials!' };
    }
    if (password !== user.password) {
        return { valid: false, status: 401, message: 'Invalid credentials, wrong password!' };
    }
    if (!user.active) {
        return { valid: false, status: 403, message: 'User inactive.' };
    }
    return { valid: true, user: user };
}

function serializeUser(user) {
    return {
        id: user.id,
        username: user.username,
        role: user.role,
        manager_nav_collapsed: user.manager_nav_collapsed,
        manager_view: user.manager_view_enabled,
    };
}

async function checkAccess(req) {
    if (!req.session) {
        return {access: false, user: null, status: 401, message: 'No session found.'};
    }

    let user = req.session.user;
    if (!user) {
        return {access: false, user: null, status: 401, message: 'No user found.'};
    }

    const pool = await poolPromise;
    const result = await pool
        .request()
        .input('userID', sql.Int, user.id)
        .query('SELECT ID, username, role, active, manager_view_enabled, manager_nav_collapsed FROM Users WHERE id = @userID');

    if (!result.recordset[0]) {
        return {access: false, user: null, status: 401, message: 'No user.'};
    }

    user = serializeUser(result.recordset[0]);

    if (!user.active) {
        return {access: false, user: user, status: 403, message: 'Access denied.'};
    }

    return {access: true, user: user, status: 200, message: 'Authorization successfully!'};
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
    authUser,
    serializeUser,
    checkAccess,
    logoutUser,
};

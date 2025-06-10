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
    logoutUser,
};

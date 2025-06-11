//BACKEND/auth.js
const { sql, poolPromise } = require('./db');
const bcrypt = require('bcrypt');

async function authUser(login, password) {

    const isInteger = Number.isInteger(Number(login));

    const query = isInteger
        ? 'SELECT * FROM Users WHERE ID = @login'
        : 'SELECT * FROM Users WHERE email = @login';

    const pool = await poolPromise;

    const result = await pool
        .request()
        .input('login', isInteger ? sql.Int : sql.VarChar, login)
        .query(query);

    const user = result.recordset[0] || null;

    if (!user)
        return { valid: false, status: 401, message: 'Invalid credentials!' };

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
        return { valid: false, status: 401, message: 'Invalid credentials, wrong password!' };


    if (!user.active)
        return { valid: false, status: 403, message: 'User inactive.' };


    return { valid: true, user: user };
}

// async function hashPassword(password) {
//     const saltRounds = 10;
//     return await bcrypt.hash(password, saltRounds);
// }

function serializeUser(user) {

    return {
        id: user.ID,
        first_name: user.first_name,
        last_name: user.last_name,
        active: user.active,
        role: user.role,
        manager_nav_collapsed: user.manager_nav_collapsed,
        manager_view: user.manager_view_enabled,
    };

}

async function refreshUser(user) {
    try {

        const pool = await poolPromise

        const result = await pool
            .request()
            .input('userID', sql.Int, user.id)
            .query('SELECT * FROM Users WHERE ID = @userID');

        if (result.recordset[0])
            return serializeUser(result.recordset[0]);

        else
            return null;

    } catch(err) {
        return null;
    }


}

async function checkUserAccess(user) {
    try {

        const pool = await poolPromise

        const result = await pool
            .request()
            .input('userID', sql.Int, user.id)
            .query(`
                SELECT active FROM users WHERE ID = @userID
            `);

        if (!result.recordset[0])
            return false;

        else
            return result.recordset[0].active;


    } catch(err) {

        return false;

    }
}

async function checkManagerAccess(user) {
    try {

        const pool = await poolPromise

        const result = await pool

            .request()
            .input('userID', sql.Int, user.id)
            .query(`
                SELECT ID FROM manager_view_access WHERE userID = @userID
            `);

        return !!result.recordset[0];

    } catch(err) {

        console.error(`Error checking Manager Access for userID: ${user.id}`, err);

        return false;

    }

}

async function setManagerView(user, value) {
    try {

        const pool = await poolPromise

        const result = await pool
            .request()
            .input('userID', sql.Int, user.id)
            .input('managerView', sql.Bit, value)
            .query(`
                UPDATE users
                SET manager_view_enabled = @managerView
                WHERE id = @userID;
            `);

        return result.rowsAffected[0] === 1;

    } catch(err) {

        console.error(`Error updating manager view for userID: ${user.id}`, err);

        return false;

    }
}

async function setNavCollapsed(user, value) {
    try {

        const pool = await poolPromise

        const result = await pool
            .request()
            .input('userID', sql.Int, user.id)
            .input('navCollapsed', sql.Bit, value)
            .query(`
                UPDATE users
                SET manager_nav_collapsed = @navCollapsed
                WHERE id = @userID;
            `);

        return result.rowsAffected[0] === 1;

    } catch(err) {

        console.error(`Error updating manager view for userID: ${user.id}`, err);

        return false;

    }

}

async function getPages(user) {
    try {

        const isManagerView = user?.manager_view || false;

        const pool = await poolPromise;

        const table = isManagerView ? 'pages_manager' : 'pages_staff';

        const queryResult = await pool.request().query(`
            SELECT id, parent_id, path, title, icon, min_role, component
            FROM ${table}
            ORDER BY CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END, parent_id, id
        `);

        const rows = queryResult.recordset;

        const pages = [];
        const pageMap = new Map();

        for (const row of rows) {

            const page = {
                path: row.path,
                title: row.title,
                icon: row.icon,
                minRole: row.min_role,
                ...(row.component ? {component: row.component} : {}),
                ...(row.parent_id ? {} : { subpages: [] }),
            };

            if (!row.parent_id) {

                pageMap.set(row.id, page);

                pages.push(page);

            } else {

                const parent = pageMap.get(row.parent_id);

                if (parent)
                    parent.subpages.push({
                        path: row.path,
                        title: row.title,
                        minRole: row.min_role,
                        component: row.component,
                    });


            }
        }

        return pages;

    } catch(err) {

        console.error(`Error getting pages: ${err}`, err);

        return [];

    }
}

function logoutUser(req, res) {
    req.session.destroy(err => {

        if (err)
            return res.status(500).json({ message: 'Logout failed' });

        res.clearCookie('connect.sid', { path: '/', sameSite: 'lax', httpOnly: true });

        res.json({ message: 'Logged out' });

    });
}

module.exports = {
    authUser,
    serializeUser,
    refreshUser,
    checkUserAccess,
    checkManagerAccess,
    setManagerView,
    setNavCollapsed,
    getPages,
    logoutUser
};

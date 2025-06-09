//BACKEND/staff.js
const express = require('express');
const router = express.Router();
const {
    authUser,
    serializeUser,
    checkAccess,
    logoutUser
} = require('./auth');
const {sql, poolPromise} = require("./db");

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const userAuth = await authUser(username, password);

        if (!userAuth.valid) {
            return res.status(userAuth.status).json({ message: userAuth.message });
        }

        const sessionUser = serializeUser(userAuth.user);

        req.session.user = sessionUser;

        return res.json({
            message: 'Login successful!',
            user: sessionUser
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

router.get('/logout', (req, res) => {
    logoutUser(req, res);
});


router.get('/access', async (req, res) => {
    const result = await checkAccess(req);

    return res.json({
        access: result.access,
        message: result.message,
        user: result.user || null
    });
});

router.get('/manager-access', async (req, res) => {
    if (!req.session) {
        return res.status(401).json({access: false, message: 'No session found.'});
    }

    const user = req.session.user;
    if (!user) {
        return res.status(401).json({access: false, message: 'No user found.'});
    }

    const pool = await poolPromise;
    const result = await pool
        .request()
        .input('userID', sql.Int, user.id)
        .query('SELECT id FROM manager_view_access WHERE id = @userID');

    if (!result.recordset[0]) {
        return res.status(401).json({access: false, message: 'No access.'});
    }

    return res.status(200).json({access: true, message: 'Access granted.'});
});

router.post('/manager-view', async (req, res) => {
    try {
        const {user, manager_view} = req.body;

        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('userID', sql.Int, user)
            .input('managerView', sql.Bit, manager_view)
            .query(`
                UPDATE users
                SET manager_view_enabled = @managerView
                WHERE id = @userID;
                SELECT manager_view_enabled AS managerView
                FROM users
                WHERE id = @userID;
            `);

        return res.json({ success: true, result: result.recordset[0]});
    } catch (err) {
        console.error('Error toggling NAV:', err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

router.get('/pages', async (req, res) => {
    try {
        const pool = await poolPromise;
        const queryResult = await pool.request().query(`
            SELECT id, parent_id, path, title, icon, min_role, component
            FROM pages_staff
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
                if (parent) {
                    parent.subpages.push({
                        path: row.path,
                        title: row.title,
                        minRole: row.min_role,
                        component: row.component,
                    });
                }
            }
        }

        res.json(pages);

    } catch (err) {
        console.error('Error fetching pages:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.get('/toggle-nav', async (req, res) => {
    try {
        const user = req.session?.user;
        if (!user || !user.id)
            res.json(null);

        const pool = await poolPromise;

        const result = await pool
            .request()
            .input('userID', sql.Int, user.id)
            .query(`
                UPDATE users
                SET manager_nav_collapsed = 1 - manager_nav_collapsed
                WHERE id = @userID;
                SELECT manager_nav_collapsed AS isCollapsed
                FROM users
                WHERE id = @userID;
            `);

        res.json({ isCollapsed: result.recordset[0].isCollapsed });
    } catch (err) {
        console.error('Error toggling NAV:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;

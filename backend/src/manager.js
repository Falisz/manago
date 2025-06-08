//BACKEND/manager.js
const express = require('express');
const router = express.Router();
const {
    findUser,
    validateUser,
    serializeUser,
    checkAccess,
    logoutUser
} = require('./auth');
const {poolPromise, sql} = require("./db");

const allowedRoles = [2, 3];

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await findUser(username);

        const validation = await validateUser(user, password, allowedRoles);

        if (!validation.valid) {
            return res.status(validation.status).json({ message: validation.message });
        }

        const sessionUser = serializeUser(user);
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

router.get('/access-check', async (req, res) => {
    const result = await checkAccess(req, allowedRoles);

    return res.status(result.status).json({
        message: result.message,
        user: result.user || null
    });
});

router.get('/pages', async (req, res) => {
    const accessCheckup = await checkAccess(req, allowedRoles);

    if (!accessCheckup.access) {
        return res.json({
            access: false,
            pages: [],
            message: accessCheckup.message,
            user: accessCheckup.user || null
        });
    }

    try {
        const pool = await poolPromise;
        const queryResult = await pool.request().query(`
            SELECT id, parent_id, path, title, icon, min_role, component
            FROM pages_manager
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

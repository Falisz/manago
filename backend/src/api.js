//BACKEND/api.js
const express = require('express');
const router = express.Router();
const {
    authUser,
    logoutUser
} = require('./auth');

const {sql, poolPromise} = require("./db");

function serializeUser(user) {
    return {
        id: user.ID,
        active: user.active,
        username: user.username,
        role: user.role,
        manager_nav_collapsed: user.manager_nav_collapsed,
        manager_view: user.manager_view_enabled,
    };
}

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
    try {
        if (!req.session) {
            return res.status(401).json({
                access: false,
                manager_access: false,
                message: 'No session found.'
            });
        }

        const user = req.session.user;

        if (!user) {
            return res.status(401).json({
                access: false,
                manager_access: false,
                message: 'No user found.'
            });
        }

        const userId = parseInt(user.id, 10);

        if (!userId || isNaN(userId)) {
            return res.status(401).json({
                access: false,
                manager_access: false,
                message: 'Invalid user ID in session.'
            });
        }

        const pool = await poolPromise;

        const result = await pool
            .request()
            .input('userID', sql.Int, userId)
            .query(`
                SELECT
                    u.ID,
                    u.username,
                    u.role,
                    u.active,
                    u.manager_view_enabled,
                    u.manager_nav_collapsed,
                    CAST(IIF(mva.ID IS NOT NULL, 1, 0) AS BIT) AS manager_access
                FROM users AS u
                         LEFT JOIN manager_view_access AS mva ON u.ID = mva.[user]
                WHERE u.ID = @userID
            `);

        if (!result.recordset[0]) {
            return res.status(401).json({
                access: false,
                manager_access: false,
                message: 'User from the session not found.'
            });
        }

        const checkedUser = serializeUser(result.recordset[0]);

        const managerAccess = !!result.recordset[0].manager_access;

        if (!managerAccess && checkedUser.manager_view) {
            await pool
                .request()
                .input('userID', sql.Int, userId)
                .input('managerView', sql.Bit, false)
                .query(`
                UPDATE users
                SET manager_view_enabled = @managerView
                WHERE id = @userID;
            `);
            req.session.user.manager_view = false;
            checkedUser.manager_view = false;
        }

        if (!checkedUser.active) {
            return res.status(401).json({
                access: false,
                manager_access: false,
                message: 'User not active.',
                user: checkedUser,
            });
        }

        return res.json({
            access: true,
            manager_access: managerAccess,
            message: 'Access checkup successful!',
            user: checkedUser,
        });
    } catch(err) {
        console.error('Access checkup error:', err);
        return res.status(500).json({
            access: false,
            manager_access: false,
            message: 'Access checkup error!',
            user: null,
        });
    }
});

router.post('/manager-view', async (req, res) => {
    try {
        const {user, manager_view} = req.body;

        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('userID', sql.Int, user.id)
            .input('managerView', sql.Bit, manager_view)
            .query(`
                UPDATE users
                SET manager_view_enabled = @managerView
                WHERE id = @userID;
                SELECT manager_view_enabled AS managerView
                FROM users
                WHERE id = @userID;
            `);

        req.session.user.manager_view = manager_view;

        res.json({ success: true, managerView: result.recordset[0].managerView });
    } catch (err) {
        console.error('Error changing manager view state:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

router.get('/pages', async (req, res) => {
    try {
        const isManagerView = req.session.user?.manager_view || false;

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

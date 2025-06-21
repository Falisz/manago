//BACKEND/api.js
const express = require('express');
const router = express.Router();
const {
    authUser,
    serializeUser,
    refreshUser,
    checkUserAccess,
    checkManagerAccess,
    setManagerView,
    setNavCollapsed,
    getPages,
    logoutUser
} = require('./utils');

router.get('/ping', async (req, res) => {
    try {
        res.json({ connected: true });
    } catch (err) {
        console.error('Ping error:', err);
        res.status(500).json({ connected: false });
    }
});

router.post('/login', async (req, res) => {

    const { username, password } = req.body;

    try {

        const userAuth = await authUser(username, password);

        if (!userAuth.valid)
            return res.status(userAuth.status).json({ message: userAuth.message });

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

            return res.json({
                access: false,
                manager_access: false,
                message: 'No session found.'
            });

        }

        req.session.user = await refreshUser(req.session.user);

        const user = req.session.user;

        if (!user) {

            return res.json({
                access: false,
                manager_access: false,
                message: 'No user found.'
            });

        }

        const userAccess = await checkUserAccess(user);

        if (!userAccess) {

            return res.json({
                access: false,
                manager_access: false,
                message: 'User not active.',
                user: user,
            });

        }

        const managerAccess = await checkManagerAccess(user);

        if (!managerAccess && user.manager_view) {

            await setManagerView(user, false);

            req.session.user.manager_view = false;

            user.manager_view = false;

        }

        return res.json({
            access: true,
            manager_access: managerAccess,
            message: 'Access checkup successful!',
            user: user,
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

        await setManagerView(user, manager_view);

        req.session.user.manager_view = manager_view;

        res.json({ success: true, managerView: manager_view });

    } catch (err) {

        console.error('Error changing manager view state:', err);

        res.status(500).json({ success: false, message: 'Server error.' });

    }
});

router.post('/toggle-nav', async (req, res) => {
    try {

        const {user, nav_collapsed} = req.body;

        await setNavCollapsed(user, nav_collapsed);

        req.session.user.manager_view = nav_collapsed;

        res.json({ success: true, navCollapse: nav_collapsed});

    } catch (err) {

        console.error('Error while toggling nav:', err);

        res.status(500).json({ message: 'Server error.' });

    }
});

router.get('/pages', async (req, res) => {
    try {

        const user = req.session.user;

        const pages = await getPages(user);

        res.json(pages);

    } catch (err) {

        console.error('Error fetching pages:', err);

        res.status(500).json({ message: 'Server error.' });

    }
});

module.exports = router;

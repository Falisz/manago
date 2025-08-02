//BACKEND/api/auth.js
const router = require('express').Router();
const {
    authUser,
    refreshUser,
    checkUserAccess,
    checkManagerAccess,
} = require('../utils/auth');
const {setManagerView} = require("../controllers/users");
const {UserConfigs} = require("../db");

router.post('/login', async (req, res) => {
    try {

        const {username, password} = req.body;

        const userAuth = await authUser(username, password);

        if (!userAuth.valid)
            return res.status(userAuth.status).json({message: userAuth.message});

        req.session.user = userAuth.user;

        return res.json({
            message: 'Login successful!',
            user: userAuth,
        });

    } catch (err) {

        console.error('Login error:', err);

        res.status(500).json({ message: "Internal Login error." });

    }

});

router.get('/logout', (req, res) => {
    try {

        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: 'Logout failed' });
            }

            res.clearCookie('connect.sid', { path: '/', sameSite: 'lax', httpOnly: true });

            return res.json({ message: 'Logged out' });
        });

    } catch (err) {

        console.error('Logout error:', err);

        res.status(500).json({ message: "Internal error." });

    }

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

            await UserConfigs.update(
                { manager_view_enabled: false },
                { where: { user: user.ID } }
            );

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

module.exports = router;
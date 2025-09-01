//BACKEND/api/auth.js
import express from 'express';
import {authUser, refreshUser, checkUserAccess, checkManagerAccess} from '../utils/auth.js';
import {setManagerView} from "../utils/manager-view.js";
import {securityLog} from "../utils/security-logs.js";

export const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown IP';
        const host = req.headers.host || 'Unknown Host';

        const {username, password} = req.body;

        const userAuth = await authUser(username, password);

        if (!userAuth.valid) {
            if (userAuth.user?.id)
                await securityLog(userAuth.user?.id, ip + " " + host,"Login","Failure: " + userAuth.message);
            return res.status(userAuth.status).json({message: userAuth.message});
        }

        req.session.user = userAuth.user;

        await securityLog(userAuth.user?.id, ip + " " + host,"Login","Success.")

        console.log(`User ${userAuth.user?.username} logged in from ${ip} (${host})`);

        return res.json({
            message: 'Login successful!',
            user: userAuth,
        });

    } catch (err) {
        console.error('Login error:', err);

        res.status(500).json({ message: "Internal Login error." });
    }
});

// Logout endpoint
router.get('/logout', async (req, res) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown IP';
    const host = req.headers.host || 'Unknown Host';
    const userId = req.session.user?.id;

    try {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: 'Logout failed' });
            }

            res.clearCookie('connect.sid', { path: '/', sameSite: 'lax', httpOnly: true });

            return res.json({ message: 'Logged out' });
        });

        await securityLog(userId, ip + " " + host,"Logout","Success.");

    } catch (err) {
        console.error('Logout error:', err);

        res.status(500).json({ message: "Internal error." });
    }
});

// Access Check-up endpoint
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
            await setManagerView(user.id, false);
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

export default router;
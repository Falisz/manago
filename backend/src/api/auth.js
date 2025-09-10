// BACKEND/api/auth.js
import express from 'express';
import { securityLog } from '../utils/security-logs.js';
import { authUser, getUser} from "../controllers/users.js";
export const router = express.Router();

// User authorisation endpoint
router.get('/auth', async (req, res) => {
    try {
        if (!req.session) {
            return res.json({
                message: 'User authorisation failed, no session found.'
            });
        }

        if (!req.session.user) {
            return res.json({
                message: 'User authorisation failed, no session user found.'
            });
        }

        req.session.user = await getUser(req.session.user.id);

        const user = req.session.user;

        if (!user || user.removed) {
            return res.json({
                message: 'User authorisation failed, no user found.'
            });
        }

        return res.json({
            message: 'User authorisation successful!',
            user,
        });

    } catch(err) {
        console.error('Access checkup error:', err);
        return res.status(500).json({
            message: 'User authorisation error!',
            user: null,
        });
    }
});

// Login endpoint
router.post('/auth', async (req, res) => {
    try {
        const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown IP';
        const host = req.headers.host || 'Unknown Host';

        const {username, password} = req.body;

        if (!username || !password) {
            return res.status(400).json({message: 'Both credentials are required!'});
        }

        const userAuth = await authUser(username, password);

        if (!userAuth.valid) {
            if (userAuth.user?.id)
                await securityLog(userAuth.user?.id, ip + ' ' + host,'Login','Failure: ' + userAuth.message);
            return res.status(userAuth.status).json({message: userAuth.message});
        }

        const user = userAuth.user;

        req.session.user = user;

        await securityLog(userAuth.user?.id, ip + ' ' + host,'Login','Success.');

        return res.json({
            message: 'User authorisation successful!',
            user
        });

    } catch (err) {
        console.error('Login error:', err);

        res.status(500).json({ message: 'Internal Login error.' });
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

        await securityLog(userId, ip + ' ' + host,'Logout','Success.');

    } catch (err) {
        console.error('Logout error:', err);

        res.status(500).json({ message: 'Internal error.' });
    }
});

export default router;
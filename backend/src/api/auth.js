// BACKEND/api/auth.js
import express from 'express';
import { securityLog } from '../utils/securityLogs.js';
import { authUser, getUser } from '../controllers/users.js';

// API Handlers
/**
 * Check user authorization.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {number} req.session.user
 * @param {express.Response} res
 */
const authHandler = async (req, res) => {
    try {
        if (!req.session || !req.session.user)
            return res.json({
                message: 'User authorization failed, no user session found.'
            });

        const user = await getUser({ id: req.session.user, include_configs: true });

        if (!user) {
            await securityLog(req.session.id, `${req.ip || 'Unknown IP'} ${req.headers.host || 'Unknown Host'}`,
                'Auth Check', 'Failure: No user found or user removed');
            return res.json({
                message: 'User authorization failed, no user found.'
            });
        }

        await securityLog(user['id'], `${req.ip || 'Unknown IP'} ${req.headers.host || 'Unknown Host'}`,
            'Auth Check', 'Success');

        return res.json({
            message: 'User authorization successful!',
            user,
        });

    } catch (err) {
        console.error('Access checkup error:', err);
        return res.status(500).json({
            message: 'User authorization error!',
            user: null,
        });
    }
};

/**
 * Handle user login.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const loginHandler = async (req, res) => {
    try {
        const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown IP';
        const host = req.headers.host || 'Unknown Host';
        const { username, password } = req.body;

        if (!username || !password) {
            await securityLog(null, `${ip} ${host}`, 'Login', 'Failure: Missing credentials');
            return res.status(400).json({ message: 'Both credentials are required!' });
        }

        const userAuth = await authUser(username, password);

        if (!userAuth.valid) {
            if (userAuth.user?.id) {
                await securityLog(userAuth.user.id, `${ip} ${host}`, 'Login', `Failure: ${userAuth.message}`);
            }
            return res.status(userAuth.status).json({ message: userAuth.message });
        }

        const user = userAuth.user;
        req.session.user = user.id;

        await securityLog(user.id, `${ip} ${host}`, 'Login', 'Success');
        return res.json({
            message: 'User authorization successful!',
            user
        });
    } catch (err) {
        console.error('Login error:', err);
        await securityLog(null, `${req.ip || 'Unknown IP'} ${req.headers.host || 'Unknown Host'}`, 'Login', `Failure: ${err.message}`);
        res.status(500).json({ message: 'Internal Login error.' });
    }
};

/**
 * Handle user logout.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const logoutHandler = async (req, res) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown IP';
    const host = req.headers.host || 'Unknown Host';
    const userId = req.session.user;

    try {
        req.session.destroy(err => {
            if (err) {
                securityLog(userId, `${ip} ${host}`, 'Logout', `Failure: ${err.message}`);
                return res.status(500).json({ message: 'Logout failed' });
            }

            res.clearCookie('connect.sid', { path: '/', sameSite: 'lax', httpOnly: true });
            securityLog(userId, `${ip} ${host}`, 'Logout', 'Success');
            return res.json({ message: 'Logged out' });
        });
    } catch (err) {
        console.error('Logout error:', err);
        await securityLog(userId, `${ip} ${host}`, 'Logout', `Failure: ${err.message}`);
        res.status(500).json({ message: 'Internal error.' });
    }
};

// Router definitions
export const router = express.Router();

router.get('/auth', authHandler);
router.post('/auth', loginHandler);
router.get('/logout', logoutHandler);

export default router;
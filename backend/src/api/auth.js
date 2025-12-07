// BACKEND/api/auth.js
import express from 'express';
import { securityLog } from '../utils/securityLogs.js';
import { authUser, getUser } from '../controllers/users.js';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
} from '../utils/jwt.js';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
};


// API Handlers
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

        const { success, status, message, id} = await authUser(username, password);
        if (!success) {
            if (id) await securityLog(id, `${ip} ${host}`, 'Login', `Failure: ${message}`);
            return res.status(status).json({ message });
        }

        const accessToken = generateAccessToken({ userId: id });
        const refreshToken = generateRefreshToken({ userId: id });
        res.cookie(
            'access_token',
            accessToken,
            { ...COOKIE_OPTIONS, maxAge: 30 * 60 * 1000 }
        );
        res.cookie(
            'refresh_token',
            refreshToken,
            { ...COOKIE_OPTIONS, sameSite: 'strict', path: '/refresh', maxAge: 30 * 24 * 60 * 60 * 1000 }
        );

        await securityLog(id, `${ip} ${host}`, 'Login', 'Success');
        return res.json({message});

    } catch (err) {
        console.error('Login error:', err);
        await securityLog(null, `${req.ip || 'Unknown IP'} ${req.headers.host || 'Unknown Host'}`, 'Login',
            `Failure: ${err.message}`);
        res.status(500).json({ message: 'Internal Login error.' });
    }
};

/**
 * Check user authorization.
 * @param {express.Request} req
 * @param {string} req.cookies.access_token
 * @param {express.Response} res
 */
const authCheckHandler = async (req, res) => {
    try {
        const token = req.cookies?.access_token;
        if (!token)
            return res.json({
                message: 'User authorization failed, no User Access Token found.',
                user: null
            });

        const { userId } = verifyAccessToken(token);
        if (!userId)
            return res.json({
                message: 'User authorization failed, no User ID in the Token found.',
                user: null
            });

        const user = await getUser({
            id: userId,
            roles: true,
            managers: true,
            all_managed_users: true,
            include_configs: true,
            permissions: true
        });

        if (!user) {
            await securityLog(userId, `${req.ip || 'Unknown IP'} ${req.headers.host || 'Unknown Host'}`,
                'Auth Check', 'Failure: No user found or user removed');
            return res.json({
                message: 'User authorization failed, no User found.',
                user: null
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
 * Refresh token.
 * @param {express.Request} req
 * @param {Object} req.cookies.refresh_token
 * @param {express.Response} res
 */
const refreshHandler = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refresh_token;
        if (!refreshToken)
            return res.status(401).json({message: 'Refresh failed, no User Refresh Token found.'});

        const { userId } = verifyRefreshToken(refreshToken);
        if (!userId)
            return res.status(401).json({message: 'Refresh failed, no User found.'});

        const newAccessToken = generateAccessToken({ userId });

        res.cookie('access_token', newAccessToken, { ...COOKIE_OPTIONS, maxAge: 30 * 60 * 1000 });
        await securityLog(userId, req.ip, 'Token Refresh', 'Success');

        return res.json({ message: 'Token refreshed' });
    } catch (err) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        return res.status(401).json({ message: 'Invalid refresh token' });
    }
};

// Router definitions
export const router = express.Router();

router.get('/auth', authCheckHandler);
router.post('/auth', loginHandler);
router.get('/refresh', refreshHandler);

export default router;
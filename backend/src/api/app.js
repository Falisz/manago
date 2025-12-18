// BACKEND/api/app.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    getModules,
    setModule,
    getPages,
    getConfig,
    getConfigOptions,
    setConfig,
    authUser,
    getUser,
    updateUser
} from '#controllers';
import checkAccess from '#utils/checkAccess.js';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
} from '#utils/jwt.js';
import { securityLog } from '#utils/securityLogs.js';

const HALF_HOUR = 30 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_MONTH = 30 * ONE_DAY;
const ACCESS_TOKEN_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
};
const REFRESH_TOKEN_OPTIONS = {
    ...ACCESS_TOKEN_OPTIONS,
    sameSite: 'strict'
};

// API Handlers
/**
 * Serve API endpoint for Staff Portal app.
 * @param {express.Request} _req
 * @param {express.Response} res
 */
const apiEndpointHandler = (_req, res) => {
    try {
        return res.sendFile(
            path.join(
                path.dirname(
                    fileURLToPath(import.meta.url)
                ), 
                '../public/index.html'
            )
        );

    } catch (err) {
        console.error('API endpoint error:', err);
        res.status(500).json({ message: 'API Error.' });
    }
};

/**
 * Handle user login.
 * @param {express.Request} req
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
        res.cookie('access_token', accessToken, { ...ACCESS_TOKEN_OPTIONS, maxAge: HALF_HOUR });
        res.cookie('refresh_token', refreshToken, { ...REFRESH_TOKEN_OPTIONS, maxAge: ONE_MONTH });

        await securityLog(id, `${ip} ${host}`, 'Login', 'Success');

        const user = await getUser({
            id: id,
            roles: true,
            managers: true,
            all_managed_users: true,
            include_configs: true,
            permissions: true
        });

        return res.json({message, user});

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
 * @param {string} req.cookies.refresh_token
 * @param {express.Response} res
 */
const authHandler = async (req, res) => {
    try {
        const { refresh } = req.query;
        if (refresh) {
            const refreshToken = req.cookies?.refresh_token;
            if (!refreshToken)
                return res.status(401).json({message: 'No User Refresh Token found.'});

            const { userId } = verifyRefreshToken(refreshToken);
            if (!userId)
                return res.status(401).json({message: 'No User ID found.'});

            const newAccessToken = generateAccessToken({ userId });

            res.cookie('access_token', newAccessToken, { ...ACCESS_TOKEN_OPTIONS, maxAge: HALF_HOUR });
            await securityLog(userId, req.ip, 'Token Refresh', 'Success');

            return res.json({ message: 'Token refreshed!' });

        }
        const token = req.cookies?.access_token;
        if (!token)
            return res.json({
                message: 'User Authentication failed, no User Access Token found.',
                user: null
            });

        const { userId } = verifyAccessToken(token);
        if (!userId)
            return res.json({
                message: 'User Authentication failed, no User ID in the Token found.',
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
                'Auth Check', 'Failure: No User found or User removed');
            return res.json({
                message: 'User Authentication failed, no User found.',
                user: null
            });
        }

        await securityLog(user['id'], `${req.ip || 'Unknown IP'} ${req.headers.host || 'Unknown Host'}`,
            'Auth Check', 'Success');

        return res.json({
            message: 'User Authentication successful!',
            user,
        });

    } catch (err) {
        console.error('Access checkup error:', err);
        return res.status(500).json({
            message: 'User Authentication server error.',
            user: null,
        });
    }
};
/**
 * Logout User.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const logoutHandler = async (req, res) => {
    try {
        res.clearCookie('access_token', ACCESS_TOKEN_OPTIONS);
        res.clearCookie('refresh_token', REFRESH_TOKEN_OPTIONS);
        return res.json({ success: true, message: 'Logged out successfully!' });
    } catch (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ success: false, message: 'Logout failed.' });
    }
};

/**
 * Fetch app configuration.
 * @param {express.Request} _req
 * @param {express.Response} res
 */
const fetchConfigHandler = async (_req, res) => {
    try {
        res.json({
            is_connected: true,
            ...await getConfig()
        });

    } catch (err) {
        console.error('Config get API error:', err);
        res.status(500).json({ message: 'API Error.', connected: false });
    }
};

/**
 * Fetch app configuration options.
 * @param {express.Request} _req
 * @param {express.Response} res
 */
const fetchConfigOptionsHandler = async (_req, res) => {
    try {
        res.json({
            ...await getConfigOptions()
        });

    } catch (err) {
        console.error('Config get API error:', err);
        res.status(500).json({ message: 'API Error.', connected: false });
    }
};

/**
 * Update app configuration.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const updateConfigHandler = async (req, res) => {

    const { hasAccess } = await checkAccess(req.user, 'update', 'app-config');

    if (!hasAccess)
        return res.status(403).json({message: 'You do not have access to change App configs.'});

    try {
        await setConfig(req.body);

        res.json({ success: true, message: 'Config updated successfully.' });

    } catch (err) {
        console.error('Config update API error:', err);
        res.status(400).json({ message: err.message || 'API Error.' });
    }
}

/**
 * Fetch app modules.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchModulesHandler = async (req, res) => {
    try {
        const token = req.cookies?.access_token;
        const { userId } = token ? verifyAccessToken(token) : {};
        if (!userId)
            return res.json([]);

        return res.json(await getModules());

    } catch (err) {
        console.error('Config fetching error:', err);
        res.status(500).json({ message: 'Config fetching Error.', connected: false });
    }
};

/**
 * Update module enabled status.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const updateModuleHandler = async (req, res) => {

    const { hasAccess } = await checkAccess(req.user, 'update', 'app-modules');

    if (!hasAccess)
        return res.status(403).json({message: 'You do not have access to change App modules.'});

    try {
        const { id } = req.params;
        const { enabled } = req.body;

        if (typeof enabled !== 'boolean')
            return res.status(400).json({ message: 'Invalid enabled value.' });

        const updated = await setModule(parseInt(id), enabled);

        if (updated[0] > 0) 
            return res.json({ success: true });
        
        res.status(404).json({ message: 'Module not found.' });
    } catch (err) {
        console.error('Error updating module:', err);
        res.status(500).json({ message: 'API Error.' });
    }
 };

/**
 * Fetch app pages.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchPagesHandler = async (req, res) => {
    try {

        const token = req.cookies?.access_token;
        const { userId } = token ? verifyAccessToken(token) : {};
        if (!userId)
            return res.json([]);

        const user = await getUser({id: userId, include_configs: true});
        const managerView = user?.manager_view_enabled ?? false;

        res.json(await getPages(managerView ? 1 : 0));
    } catch (err) {
        console.error('Error fetching pages:', err.message);
        res.status(500).json({ message: 'API Error.' });
    }
};

/**
 * Toggle manager view for a user.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const toggleManagerViewHandler = async (req, res) => {
    try {
        const { manager_view } = req.body;

        if (manager_view == null)
            return res.status(400).json({
                success: false,
                message: 'No toggle value provided.',
                manager_view: false
            });

        const hasAccess = await checkAccess(req.user, 'access', 'manager-view');

        if (!hasAccess)
            return res.status(403).json({
                success: false,
                message: 'Manager view access not permitted.',
                manager_view: false
            });

        const { success, message } = await updateUser(req.user, {manager_view_enabled: manager_view});

        if (success) {
            return res.json({
                success,
                message: 'Manager view updated successfully.',
                manager_view: manager_view
            });
        } else {
            return res.status(400).json({
                success,
                message
            });
        }
    } catch (err) {
        console.error('Error changing manager view state:', err);
        return res.status(500).json({
            success: false,
            message: 'API Error.',
            manager_view: false
        });
    }
};

/**
 * Toggle the main navigation collapse state in the Manager View.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const toggleManagerNavHandler = async (req, res) => {
    try {
        if (!req.body || typeof req.body.nav_collapsed !== 'boolean') {
            return res.status(400).json({ message: 'Invalid or missing nav_collapsed value.' });
        }

        const { nav_collapsed } = req.body;

        const { success, message } = await updateUser(req.user, {manager_nav_collapsed: nav_collapsed});

        if (success) {
            res.json({ success, navCollapse: nav_collapsed });
        } else {
            res.status(400).json({ success, message });
        }
    } catch (err) {
        console.error('Error while toggling Manager View main-nav:', err);
        res.status(500).json({ message: 'API Error.' });
    }
};

/**
 * Update user theme.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const updateUserThemeHandler = async (req, res) => {
    try {
        if (!req.body || typeof req.body.theme_mode !== 'string')
            return res.status(400).json({ message: 'Invalid or missing theme_mode value.' });

        const { theme_mode } = req.body;
        
        const { success, message } = await updateUser(req.user, { theme_mode });

        if (!success)
            return res.status(400).json({ success, message });

        res.json({ success, theme_mode });
    } catch (err) {
        console.error('Error while toggling User theme:', err);
        res.status(500).json({ message: 'API Error.' });
    }
};

// Router definitions
export const router = express.Router();

router.get('/', apiEndpointHandler)

router.post('/auth', loginHandler);
router.get('/auth', authHandler);
router.get('/logout', logoutHandler);
router.get('/config', fetchConfigHandler);
router.get('/config-options', fetchConfigOptionsHandler);
router.put('/config', updateConfigHandler);
router.get('/modules', fetchModulesHandler);
router.put('/modules/:id', updateModuleHandler);
router.get('/pages', fetchPagesHandler);
router.post('/manager-view', toggleManagerViewHandler);
router.post('/toggle-nav', toggleManagerNavHandler);
router.post('/user-theme', updateUserThemeHandler);

export default router;
// BACKEND/api/app.js
import express from 'express';
import checkAuthHandler from '../utils/checkAuth.js';
import {
    getModules,
    setModule,
    getPages,
    getConfig,
    getConfigOptions,
    setConfig
} from '../controllers/app.js';
import {
    updateUser,
    hasManagerAccess,
    hasManagerView,
} from '../controllers/users.js';

// API Handlers
/**
 * Serve API endpoint for Staff Portal app.
 * @param {express.Request} _req
 * @param {express.Response} res
 */
const apiEndpointHandler = (_req, res) => {
    try {
        return res.json({ message: 'This is API endpoint for the Staff Portal app. ' +
                'To make requests please use Staff Portal app.' });
    } catch (err) {
        console.error('API endpoint error:', err);
        res.status(500).json({ message: 'API Error.' });

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
 * @param {express.Response} res
 */
const updateConfigHandler = async (req, res) => {
    try {
        const newConfig = req.body;
        await setConfig(newConfig);
        res.json({ success: true, message: 'Config updated successfully.' });
    } catch (err) {
        console.error('Config update API error:', err);
        res.status(400).json({ message: err.message || 'API Error.' });
    }
}

/**
 * Fetch app modules.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const fetchModulesHandler = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            if (req.query['psthr'] === 'true')
                return res.json([]);
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        return res.json(await getModules());

    } catch (err) {
        console.error('Config fetching error:', err);
        res.status(500).json({ message: 'Config fetching Error.', connected: false });
    }
};

/**
 * Update module enabled status.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const updateModuleHandler = async (req, res) => {
     try {
         const { id } = req.params;
         const { enabled } = req.body;

         if (typeof enabled !== 'boolean') {
             return res.status(400).json({ message: 'Invalid enabled value.' });
         }

         if (!await hasManagerAccess(req.session.user)) {
             return res.status(403).json({ message: 'Access denied.' });
         }

         const updated = await setModule(parseInt(id), enabled);

         if (updated[0] > 0) {
             return res.json({ success: true });
         } else {
             return res.status(404).json({ message: 'Module not found.' });
         }
     } catch (err) {
         console.error('Error updating module:', err);
         return res.status(500).json({ message: 'API Error.' });
     }
 };

/**
 * Fetch app pages.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const fetchPagesHandler = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            if (req.query['psthr'] === 'true')
                return res.json([]);
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const managerView = await hasManagerView(req.session.user) ? 1 : 0;

        res.json(await getPages(managerView));
    } catch (err) {
        console.error('Error fetching pages:', err.message);
        res.status(500).json({ message: 'API Error.' });
    }
};

/**
 * Toggle manager view for a user.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const toggleManagerViewHandler = async (req, res) => {
    try {
        const { manager_view } = req.body;

        if (typeof manager_view === 'undefined') {
            return res.status(400).json({
                success: false,
                message: 'No toggle value provided.',
                manager_view: false
            });
        }

        if (!await hasManagerAccess(req.session.user)) {
            return res.status(403).json({
                success: false,
                message: 'Manager view access not permitted.',
                manager_view: false
            });
        }

        const updated = await updateUser(req.session.user, {manager_view_enabled: manager_view});

        if (updated) {
            return res.json({
                success: true,
                message: 'Manager view updated successfully.',
                manager_view: manager_view
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Failed to update manager view.'
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
 * Toggle manager view main navigation.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const toggleManagerNavHandler = async (req, res) => {
    try {
        if (!req.body || typeof req.body.nav_collapsed !== 'boolean') {
            return res.status(400).json({ message: 'Invalid or missing nav_collapsed value.' });
        }

        const { nav_collapsed } = req.body;

        const updated = await updateUser(req.session.user, {manager_nav_collapsed: nav_collapsed});

        if (updated) {
            res.json({ success: true, navCollapse: nav_collapsed });
        } else {
            res.status(400).json({ success: false, message: 'Failed to update.' });
        }
    } catch (err) {
        console.error('Error while toggling Manager View main-nav:', err);
        res.status(500).json({ message: 'API Error.' });
    }
};

/**
 * Update user theme.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateUserThemeHandler = async (req, res) => {
    try {
        if (!req.body || typeof req.body.theme_mode !== 'string') {
            return res.status(400).json({ message: 'Invalid or missing theme_mode value.' });
        }

        const { userId } = req.params;
        const { theme_mode } = req.body;

        const updated = await updateUser(userId, { theme_mode });

        if (!updated) {
            return res.status(400).json({ success: false, message: 'Failed to update.' });
        }

        res.json({ success: true, theme_mode });
    } catch (err) {
        console.error('Error while toggling User theme:', err);
        res.status(500).json({ message: 'API Error.' });
    }
};
// Router definitions
export const router = express.Router();

router.get('/', checkAuthHandler, apiEndpointHandler)
router.get('/config', fetchConfigHandler);
router.get('/config-options', fetchConfigOptionsHandler);
router.put('/config', checkAuthHandler, updateConfigHandler);
router.get('/modules', fetchModulesHandler);
router.put('/modules/:id', checkAuthHandler, updateModuleHandler);
router.get('/pages', fetchPagesHandler);
router.post('/manager-view', checkAuthHandler, toggleManagerViewHandler);
router.post('/toggle-nav', checkAuthHandler, toggleManagerNavHandler);
router.put('/user-theme/:userId', checkAuthHandler, updateUserThemeHandler);

export default router;
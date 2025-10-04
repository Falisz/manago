// BACKEND/api/app.js
import express from 'express';
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
        res.setHeader('Content-Type', 'text/html');
        return res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Manago API</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: flex-start;
                        height: 100vh;
                        margin: 0;
                        background-color: #222;
                    }
                    .message {
                        text-align: center;
                        margin-top: 50px;
                        padding: 40px;
                        color: #eee;
                        background-color: #111;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .message a {
                        color: #007bff;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="message">
                    <h1>Manago API</h1>
                    <p>This is the API for the Manago service. 
                    To make requests, please use the <a href="http://localhost:3000">Manago app</a>.</p>
                </div>
            </body>
            </html>
        `);

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
 * @param {Object} req.session
 * @param {express.Response} res
 */
const fetchModulesHandler = async (req, res) => {
    try {
        if (!req.session.user)
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
         const hasAccess = await hasManagerAccess(req.session.user);

         if (!hasAccess) {
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
        if (!req.session.user)
            return res.json([]);

        const managerView = await hasManagerView(req.session.user);

        res.json(await getPages(managerView ? 1 : 0));
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

        const hasAccess = await hasManagerAccess(req.session.user);

        if (!hasAccess)
            return res.status(403).json({
                success: false,
                message: 'Manager view access not permitted.',
                manager_view: false
            });

        const { success, message } = await updateUser(req.session.user, {manager_view_enabled: manager_view});

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
 * @param {Object} req.session
 * @param {express.Response} res
 */
const toggleManagerNavHandler = async (req, res) => {
    try {
        if (!req.body || typeof req.body.nav_collapsed !== 'boolean') {
            return res.status(400).json({ message: 'Invalid or missing nav_collapsed value.' });
        }

        const { nav_collapsed } = req.body;

        const { success, message } = await updateUser(req.session.user, {manager_nav_collapsed: nav_collapsed});

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
 * @param {express.Response} res
 */
const updateUserThemeHandler = async (req, res) => {
    try {
        if (!req.body || typeof req.body.theme_mode !== 'string') {
            return res.status(400).json({ message: 'Invalid or missing theme_mode value.' });
        }

        const { userId } = req.params;
        const { theme_mode } = req.body;

        const { success, message } = await updateUser(userId, { theme_mode });

        if (!success) {
            return res.status(400).json({ success, message });
        }

        res.json({ success, theme_mode });
    } catch (err) {
        console.error('Error while toggling User theme:', err);
        res.status(500).json({ message: 'API Error.' });
    }
};
// Router definitions
export const router = express.Router();

router.get('/', apiEndpointHandler)
router.get('/config', fetchConfigHandler);
router.get('/config-options', fetchConfigOptionsHandler);
router.put('/config', updateConfigHandler);
router.get('/modules', fetchModulesHandler);
router.put('/modules/:id', updateModuleHandler);
router.get('/pages', fetchPagesHandler);
router.post('/manager-view', toggleManagerViewHandler);
router.post('/toggle-nav', toggleManagerNavHandler);
router.put('/user-theme/:userId', updateUserThemeHandler);

export default router;
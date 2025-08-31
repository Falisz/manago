//BACKEND/api/utils.js
import express from 'express';
import {getModules, setModule, getPages} from "../controllers/app.js";
import {hasManagerAccess, hasManagerView, setManagerView, toggleManagerNav} from "../utils/manager-view.js";
export const router = express.Router();

//Server API endpoint
router.get('/',  (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }
        return res.status(200).json({ message: 'This is API endpoint for the Staff Portal app.\n' +
                'To make requests please use Staff Portal app.' });

    } catch (err) {
        console.error('API endpoint error:', err);
        res.status(500).json({ message: 'API Error.' });

    }
})

//Server ping endpoint
router.get('/ping', async (req, res) => {
    try {
        res.json({ connected: true });
    } catch (err) {
        console.error('Ping error:', err);
        res.status(500).json({ message: 'API Error.', connected: false });
    }
});

//App Config endpoint
router.get('/config', async (req, res) => {
    try {
        if (!req.session.user)
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });

        return res.status(200).json({ app_theme: 'dark', app_palette: 'blue' });

    } catch (err) {
        console.error('Config fetching error:', err);
        res.status(500).json({ message: 'Config fetching Error.', connected: false });
    }
});

//App Modules endpoint
router.get('/modules', async (req, res) => {
    try {
        if (!req.session.user)
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });

        return res.status(200).json(await getModules());

    } catch (err) {
        console.error('Config fetching error:', err);
        res.status(500).json({ message: 'Config fetching Error.', connected: false });
    }
});

// Update module enabled status endpoint
router.put('/modules/:id', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { id } = req.params;
        const { enabled } = req.body;

        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ message: 'Invalid enabled value.' });
        }

        if (!await hasManagerAccess(req.session.user.ID)) {
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
});

//App Pages endpoint
router.get('/pages', async (req, res) => {
    try {
        if (!req.session.user)
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });

        const managerView = await hasManagerView(req.session.user.ID) ? 1 : 0;

        res.json(await getPages(managerView));

    } catch (err) {

        console.error('Error fetching pages:', err.message);
        res.status(500).json({ message: 'API Error.' });

    }
});

//Manager View toggle endpoint
router.post('/manager-view', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. Please log in.',
                manager_view: false
            });
        }

        const {manager_view} = req.body;

        if (typeof manager_view === 'undefined') {
            return res.status(400).json({
                success: false,
                message: 'No toggle value provided.',
                manager_view: false
            });
        }

        if (! await hasManagerAccess(req.session.user.ID)) {
            return res.status(403).json({
                success: false,
                message: 'Manager view access not permitted.',
                manager_view: false
            });
        }

        const updated = await setManagerView(req.session.user.ID, manager_view);

        if (updated) {
            req.session.user.manager_view_enabled = manager_view;
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
});

//Toggle ManagerView main nav endpoint
router.post('/toggle-nav', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        if (!req.body || typeof req.body.nav_collapsed !== 'boolean') {
            return res.status(401).json({ message: 'Invalid or missing nav_collapsed value.' });
        }

        const {nav_collapsed} = req.body;

        const updated = await toggleManagerNav(req.session.user.ID, nav_collapsed);

        if (updated) {
            req.session.user.manager_nav_collapsed = nav_collapsed;
            res.json({ success: true, navCollapse: nav_collapsed});
        }
        else {
            res.status(401).json({ success: false, message: 'Failed to update.'});
        }

    } catch (err) {

        console.error('Error while toggling Manager View main-nav:', err);
        res.status(500).json({ message: 'API Error.' });

    }
});

export default router;
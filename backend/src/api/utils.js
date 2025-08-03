//BACKEND/api/utils.js
const router = require('express').Router();
const {
    getPages,
} = require('../controllers/pages');
const {UserConfigs} = require("../db");

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

//App Pages endpoint
router.get('/pages', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const user = req.session.user;

        const pages = await getPages(user);

        res.json(pages);

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

        const userConfig = await UserConfigs.findOne({
            where: { user: req.session.user.ID }
        });

        if (!userConfig || !userConfig.manager_view_access) {
            return res.status(403).json({
                success: false,
                message: 'Manager view access not permitted.',
                manager_view: false
            });
        }

        const [updated] = await UserConfigs.update(
            { manager_view_enabled: manager_view },
            { where: { user: req.session.user.ID } }
        );

        if (updated === 1) {
            req.session.user.manager_view_enabled = manager_view;
            return res.json({
                success: true,
                message: 'Manager view updated successfully.',
                manager_view: manager_view
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Failed to update manager view.',
                manager_view: userConfig.manager_view_enabled
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

        const [updated] = await UserConfigs.update(
            { manager_nav_collapsed: nav_collapsed },
            { where: { user: req.session.user.ID } }
        );

        if (updated === 1) {
            req.session.user.manager_nav_collapsed = nav_collapsed;
            res.json({ success: true, navCollapse: nav_collapsed});
        }
        else {
            res.status(401).json({ success: false }).json({message: 'Failed to update.'});
        }

    } catch (err) {

        console.error('Error while toggling Manager View main-nav:', err);
        res.status(500).json({ message: 'API Error.' });

    }
});

module.exports = router;
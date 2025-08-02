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
            return res.status(401).json({message: 'Unauthorized. Please log in.'});
        }

        const {manager_view} = req.body;

        if (!req.body || !manager_view) {
            return res.status(401).json({message: 'No toggle value provided.'});
        }

        const [updated] = await UserConfigs.update(
            { manager_view_enabled: manager_view },
            { where: { user: req.session.user.ID } }
        );

        if (updated === 1) {
            req.session.user.manager_view_enabled = manager_view;
            res.json({ success: true, managerView: manager_view });
        }
        else {
            res.status(401).json({ success: false }).json({message: 'Failed to update.'});
        }


    } catch (err) {

        console.error('Error changing manager view state:', err);
        res.status(500).json({ success: false, message: 'API Error.' });

    }
});

//Toggle ManagerView main nav endpoint
router.post('/toggle-nav', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const {nav_collapsed} = req.body;

        if (!req.body || !nav_collapsed) {
            return res.status(401).json({message: 'No toggle value provided.'});
        }

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
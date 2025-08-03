//BACKEND/api/roles.js
const router = require('express').Router();
const {
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    getUserRoles,
    updateUserRoles,
} = require('../controllers/roles');

router.get('/', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const roles = await getRoles();

        res.json(roles);

    } catch (err) {
        console.error('Error fetching roles:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.get('/:roleId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }
        const { roleId } = req.params;

        if (!roleId || isNaN(roleId)) {
            return res.status(400).json({ message: 'Invalid role ID.' });
        }

        const role = await getRoles(parseInt(roleId));

        res.json(role);

    } catch (err) {
        console.error('Error fetching role:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.get('/user/:userId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }
        const { userId } = req.params;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const roles = await getUserRoles(userId);

        res.json(roles);

    } catch (err) {
        console.error('Error fetching roles:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.post('/new', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { name, power, system_default } = req.body;

        const result = await createRole({
            name,
            power,
            system_default
        });

        if (!result.success) {
            return res.status(result.status || 400).json({ message: result.message });
        }

        res.status(201).json({ message: result.message, role: result.role });
    } catch (err) {
        console.error('Error creating role:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.put('/:roleId', async (req, res) => {
    try {

        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { roleId } = req.params;

        if (!roleId || isNaN(roleId)) {
            return res.status(400).json({ message: 'Invalid role ID.' });
        }

        const { name, power, system_default } = req.body;

        const result = await updateRole(parseInt(roleId), {name, power, system_default});

        if (!result.success) {
            return res.status(result.status || 400).json({ message: result.message });
        }

        res.json({ message: result.message, post: result.post });

    } catch (err) {
        console.error('Error updating role:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.put('/user/:userId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { userId } = req.params;
        const { roleIds } = req.body;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const result = await updateUserRoles(parseInt(userId), roleIds);

        if (!result.success) {
            return res.status(result.status || 400).json({ message: result.message });
        }

        res.json({ message: result.message });
    } catch (err) {
        console.error('Error updating user roles:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.delete('/:roleId', async (req, res) => {
    try {

        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { roleId } = req.params;

        if (!roleId || isNaN(roleId)) {
            return res.status(400).json({ message: 'Invalid role ID.' });
        }

        const result = await deleteRole(parseInt(roleId));

        if (!result.success) {
            return res.status(result.status || 400).json({ message: result.message });
        }

        res.json({ message: result.message });

    } catch (err) {
        console.error('Error deleting role:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
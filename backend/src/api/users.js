//BACKEND/api/users.js
import express from 'express';
import {createUser, editUser, getUsers, removeUser} from "../controllers/users.js";
// TODO: Separate model-updating/controller functionality from API endpoints.
import User from "../models/user.js";
export const router = express.Router();

router.get('/', async (req, res) => {
    try {

        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const users = await getUsers();

        res.json(users);

    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.get('/:userId', async (req, res) => {
    try {

        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { userId } = req.params;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const user = await getUsers(parseInt(userId));

        res.json(user);

    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.get('/managers/:userId', async (req, res) => {
    try {

        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { userId } = req.params;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const managers = await getUserManagers(parseInt(userId));

        res.json(managers);

    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.get('/check-id/:userId', async (req, res) => {
    const { userId } = req.params;

    try {

        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const user = await User.findOne({
            where: { ID: userId }
        });

        const isAvailable = !user;

        res.json({ available: isAvailable });

    } catch (err) {
        console.error(`Error checking user ID availability for ID ${userId}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.post('/new', async (req, res) => {
    try {

        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { login, email, password, first_name, last_name, role, active, manager_view_access } = req.body;

        const result = await createUser({
            login,
            email,
            password,
            first_name,
            last_name,
            role,
            active,
            manager_view_access
        });

        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }

        res.status(201).json({ message: result.message, user: result.user });

    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.put('/:userId', async (req, res) => {
    try {

        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { userId } = req.params;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const { login, email, password, first_name, last_name, active, manager_view_access, manager_view_enabled, manager_nav_collapsed } = req.body;

        const result = await editUser(parseInt(userId), {
            login,
            email,
            password,
            first_name,
            last_name,
            active,
            manager_view_access,
            manager_view_enabled,
            manager_nav_collapsed
        });

        if (!result.success) {
            return res.status( 400).json({ message: result.message });
        }

        res.json({ message: result.message, user: result.user });

    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.delete('/:userId', async (req, res) => {
    try {

        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { userId } = req.params;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const result = await removeUser(parseInt(userId));

        if (!result.success) {
            return res.status( 400).json({ message: result.message });
        }

        res.json({ message: 'User removed successfully!' });

    } catch (err) {
        console.error('Error removing user:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;
// BACKEND/api/users.js
import express from 'express';
import {
    getUsers,
    getUser,
    createUser,
    editUser,
    removeUser,
    getManagers,
    getEmployees,
    getUserManagers,
    getManagedUsers,
    updateUserManagers,
} from "../controllers/users.js";
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

router.get('/managers', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const managers = await getManagers();

        res.json(managers);

    } catch (err) {
        console.error('Error fetching managers:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.get('/employees', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const employees = await getEmployees();

        res.json(employees);

    } catch (err) {
        console.error('Error fetching employees:', err);
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
        console.error('Error fetching managers:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.get('/managed-users/:managerId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { managerId } = req.params;

        if (!managerId || isNaN(managerId)) {
            return res.status(400).json({ message: 'Invalid manager ID.' });
        }

        const managedUsers = await getManagedUsers(parseInt(managerId));

        res.json(managedUsers);

    } catch (err) {
        console.error('Error fetching managed users:', err);
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

        const user = await getUser(parseInt(userId));

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(user);

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

        const user = await getUsers(parseInt(userId));

        const isAvailable = !user;

        res.json({ available: isAvailable });

    } catch (err) {
        console.error(`Error checking user ID availability for ID ${userId}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.post('/', async (req, res) => {
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

        const user = await getUser(parseInt(result.user.id));

        res.status(201).json({ message: result.message, user: user });

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

        const user = await getUsers(parseInt(result.user.id));

        res.json({ message: result.message, user: user });

    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.put('/managers/:userId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { userId } = req.params;
        const { managers } = req.body;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const result = await updateUserManagers(parseInt(userId), managers);

        if (!result.success) {
            return res.status(result.status || 400).json({ message: result.message });
        }

        res.json({ message: result.message });
    } catch (err) {
        console.error('Error updating user roles:', err);
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
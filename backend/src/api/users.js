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
import {
    updateUserRoles,
} from "../controllers/roles.js";

export const router = express.Router();

/**
 * Fetch all users.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchUsers = async (req, res) => {
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
};

/**
 * Fetch all managers.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchManagers = async (req, res) => {
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
};

/**
 * Fetch all employees.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchEmployees = async (req, res) => {
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
};

/**
 * Fetch managers for a specific user.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchUserManagers = async (req, res) => {
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
};

/**
 * Fetch users managed by a specific manager.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchManagedUsers = async (req, res) => {
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
};

/**
 * Fetch a specific user by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchUserById = async (req, res) => {
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
        console.error('Error fetching user:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new user.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const createNewUser = async (req, res) => {
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
};

// Router definitions
router.get('/', fetchUsers);
router.get('/managers', fetchManagers);
router.get('/employees', fetchEmployees);
router.get('/managers/:userId', fetchUserManagers);
router.get('/managed-users/:managerId', fetchManagedUsers);
router.get('/:userId', fetchUserById);
router.post('/', createNewUser);


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

router.post('/assignments', async(req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { resource, resourceIds, userIds, mode } = req.body;
        let result;

        if (resource === 'manager') {
            result = await updateUserManagers(userIds, resourceIds, mode);
        } else if (resource === 'role') {
            result = await updateUserRoles(userIds, resourceIds, mode);
        }

        if (!result.success) {
            return res.status(result.status || 400).json({ message: result.message });
        }

        res.json({ message: result.message });

    } catch (err) {
        console.error('Error editing user assignments:', err);
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
        const { managerIds } = req.body;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const result = await updateUserManagers([parseInt(userId)], managerIds, 'set');

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

router.delete('/', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { userIds } = req.body;

        console.log('Request for bulk-delete of ', userIds);

        res.status(400).json({ message: 'Bulk-delete not implemented yet!' });

    } catch (err) {
        console.error('Error removing user:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;
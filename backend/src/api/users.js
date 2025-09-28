// BACKEND/api/users.js
import express from 'express';
import checkAuthHandler from '../utils/check-auth.js';
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
} from '../controllers/users.js';
import {
    updateUserRoles,
} from '../controllers/roles.js';

// API Handlers
/**
 * Fetch all users.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchUsersHandler = async (req, res) => {
    try {
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
const fetchManagersHandler = async (req, res) => {
    try {
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
const fetchEmployeesHandler = async (req, res) => {
    try {
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
const fetchUserManagersHandler = async (req, res) => {
    try {
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
const fetchManagedUsersHandler = async (req, res) => {
    try {
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
const fetchUserByIdHandler = async (req, res) => {
    try {
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
const createNewUserHandler = async (req, res) => {
    try {
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

/**
 * Check user ID availability.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const checkUserIdHandler = async (req, res) => {
    const { userId } = req.params;

    try {
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
};

/**
 * Update user assignments (managers or roles).
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateAssignmentsHandler = async (req, res) => {
    try {
        const {resource, resourceIds, userIds, mode} = req.body;
        let result;

        if (resource === 'manager') {
            result = await updateUserManagers(userIds, resourceIds, mode);
        } else if (resource === 'role') {
            result = await updateUserRoles(userIds, resourceIds, mode);
        } else {
            return res.status(400).json({message: 'Unknown resource.'});
        }

        if (!result.success) {
            return res.status(result.status || 400).json({message: result.message});
        }

        res.json({message: result.message});

    } catch (err) {
        console.error('Error editing user assignments:', err);
        res.status(500).json({message: 'Server error.'});
    }
};

/**
 * Update a specific user by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateUserHandler = async (req, res) => {
    try {
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
};

/**
 * Update managers for a specific user.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateUserManagersHandler = async (req, res) => {
    try {
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
};

/**
 * Delete a specific user by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteUserHandler = async (req, res) => {
    try {
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
};

/**
 * Bulk delete users by IDs.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const bulkDeleteUsersHandler = async (req, res) => {
    try {
        const { userIds } = req.body;

        const result = await removeUser(userIds);

        if (!result.success) {
            return res.status( 400).json({ message: result.message });
        }

        res.json({ message: 'User removed successfully!' });

    } catch (err) {
        console.error('Error removing user:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Router definitions
export const router = express.Router();

router.get('/', checkAuthHandler, fetchUsersHandler);
router.get('/managers', checkAuthHandler, fetchManagersHandler);
router.get('/employees', checkAuthHandler, fetchEmployeesHandler);
router.get('/managers/:userId', checkAuthHandler, fetchUserManagersHandler);
router.get('/managed-users/:managerId', checkAuthHandler, fetchManagedUsersHandler);
router.get('/:userId', checkAuthHandler, fetchUserByIdHandler);
router.get('/check-id/:userId', checkAuthHandler, checkUserIdHandler);
router.post('/', checkAuthHandler, createNewUserHandler);
router.post('/assignments', checkAuthHandler, updateAssignmentsHandler);
router.put('/:userId', checkAuthHandler, updateUserHandler);
router.put('/managers/:userId', checkAuthHandler, updateUserManagersHandler);
router.delete('/:userId', checkAuthHandler, deleteUserHandler);
router.delete('/', checkAuthHandler, bulkDeleteUsersHandler);

export default router;
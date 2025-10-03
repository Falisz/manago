// BACKEND/api/users.js
import express from 'express';
import checkAuthHandler from '../utils/checkAuth.js';
import {
    getUser,
    createUser,
    updateUser,
    removeUser,
    getUserManagers,
    getUserRoles,
    updateUserRoles,
    updateUserManagers
} from '../controllers/users.js';

// API Handlers
/**
 * Fetch Users or a User by their ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchUsersHandler = async (req, res) => {
    try {
        const falsy = [0, '0', 'false', false, 'no', 'not'];
        const users = await getUser({ 
            id: req.params.userId,
            group: req.query.group,
            roles: falsy.includes(req.query.roles) ? false : true,
            managers: falsy.includes(req.query.managers) ? false : true,
            managed_users: falsy.includes(req.query.managed_users) ? false : true 
        });

        if (req.params.userId && !users)
            return res.status(404).json({ message: 'User not found.' });

        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Fetch Roles for a specific User ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchUserRolesHandler = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId)
            return res.status(400).json({ message: 'User ID is missing.' });

        if (isNaN(userId))
            return res.status(400).json({ message: 'Invalid user ID.' });

        const managers = await getUserRoles({ userId });

        res.json(managers);
    } catch (err) {
        console.error('Error fetching managers:', err);
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

        if (!userId)
            return res.status(400).json({ message: 'User ID is missing.' });

        if (isNaN(userId))
            return res.status(400).json({ message: 'Invalid User ID.' });

        const managers = await getUserManagers({ userId });

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
        const { userId } = req.params;

        if (!userId)
            return res.status(400).json({ message: 'Manager ID is missing.' });

        if (isNaN(userId))
            return res.status(400).json({ message: 'Invalid Manager ID.' });

        const managedUsers = await getUserManagers({ managerId: userId });
        
        res.json(managedUsers);
    } catch (err) {
        console.error('Error fetching managed users:', err);
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

        if (!result.success)
            return res.status(400).json({ message: result.message });

        const user = await getUser({id: result.user.id});
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

        const user = await getUser({id: userId, removed: true});

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

        const result = await updateUser(parseInt(userId), {
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

        res.json({ message: result.message, user: await getUser({id: userId}) });

    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update Roles for a specific User.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateUserRolesHandler = async (req, res) => {
    try {
        const { userId } = req.params;
        const { roleIds } = req.body;

        if (!userId)
            return res.status(400).json({ message: 'User ID is missing.' });

        if (isNaN(userId))
            return res.status(400).json({ message: 'Invalid User ID.' });

        const result = await updateUserRoles([parseInt(userId)], roleIds);

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
 * Update Managers for a specific User.
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
router.get('/:userId', checkAuthHandler, fetchUsersHandler);
router.get('/:userId/roles', checkAuthHandler, fetchUserRolesHandler);
router.get('/:userId/managers', checkAuthHandler, fetchUserManagersHandler);
router.get('/:userId/managed-users', checkAuthHandler, fetchManagedUsersHandler);
router.get('/check-id/:userId', checkAuthHandler, checkUserIdHandler);
router.post('/', checkAuthHandler, createNewUserHandler);
router.post('/assignments', checkAuthHandler, updateAssignmentsHandler);
router.put('/:userId', checkAuthHandler, updateUserHandler);
router.put('/:userId/roles', checkAuthHandler, updateUserRolesHandler);
router.put('/:userId/managers', checkAuthHandler, updateUserManagersHandler);
router.delete('/:userId', checkAuthHandler, deleteUserHandler);
router.delete('/', checkAuthHandler, bulkDeleteUsersHandler);

export default router;
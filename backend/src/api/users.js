// BACKEND/api/users.js
import express from 'express';
import checkAuthHandler from '../utils/checkAuth.js';
import checkResourceIdHandler from '../utils/checkResourceId.js';
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
    const { id } = req.params;

    try {
        const falsy = [0, '0', 'false', false, 'no', 'not'];

        const users = await getUser({ 
            id,
            group: req.query.group,
            roles: !falsy.includes(req.query.roles),
            managers: !falsy.includes(req.query.managers),
            managed_users: !falsy.includes(req.query.managed_users)
        });

        if (req.params.userId && !users)
            return res.status(404).json({ message: 'User not found.' });

        res.json(users);

    } catch (err) {
        console.error(`Error fetching User${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Fetch Roles for a specific User.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchUserRolesHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const managers = await getUserRoles({ userId: id });

        res.json(managers);

    } catch (err) {
        console.error(`Error fetching User Roles (User ID: ${id}):`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Fetch Managers for a specific User.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchUserManagersHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const managers = await getUserManagers({ userId: id });

        res.json(managers);

    } catch (err) {
        console.error(`Error fetching User Managers (User ID: ${id}):`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Fetch users managed by a specific manager.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchManagedUsersHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const managedUsers = await getUserManagers({ managerId: id });
        
        res.json(managedUsers);

    } catch (err) {
        console.error(`Error fetching Managed Users (Manager ID: ${id}):`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new User.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const createUserHandler = async (req, res) => {
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

        const user = await getUser({id: result.user});

        res.status(201).json({ message: result.message, user });

    } catch (err) {
        console.error('Error creating User:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Check user ID availability.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const checkUserIdHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await getUser({id, removed: true});

        res.json({ available: !user });

    } catch (err) {
        console.error(`Error checking User ID availability for ID ${id}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific user by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateUserHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const { login, email, password, first_name, last_name, active,
            manager_view_access, manager_view_enabled, manager_nav_collapsed } = req.body;

        const result = await updateUser(parseInt(id), {
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

        if (!result.success)
            return res.status(400).json({ message: result.message });

        res.json({ message: result.message, user: result.user });

    } catch (err) {
        console.error(`Error updating User (ID: ${id}):`, err, 'Provided data: ', req.body);
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
    
        if (!userIds || !userIds.length)
            return res.status(400).json({ message: 'User IDs are missing.' });

        let result;

        if (resource === 'manager')
            result = await updateUserManagers(userIds, resourceIds, mode);

        else if (resource === 'role')
            result = await updateUserRoles(userIds, resourceIds, mode);

        else 
            return res.status(400).json({message: 'Unknown Resource type provided.'});

        if (!result.success)
            return res.status(result.status || 400).json({message: result.message});

        res.json({message: result.message});

    } catch (err) {
        console.error('Error updating User assignments:', err, 'Provided data: ', req.body);
        res.status(500).json({message: 'Server error.'});
    }
};

/**
 * Update Roles for a specific User.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateUserRolesHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const { roleIds } = req.body;

        const result = await updateUserRoles([parseInt(id)], roleIds, 'set');

        if (!result.success)
            return res.status(result.status || 400).json({ message: result.message });

        res.json({ message: result.message });
    } catch (err) {
        console.error(`Error updating User Roles (User ID: ${id}):`, err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update Managers for a specific User.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateUserManagersHandler = async (req, res) => {
    const { id } = req.params;
    
    try {
        const { managerIds } = req.body;

        const result = await updateUserManagers([parseInt(id)], managerIds, 'set');

        if (!result.success)
            return res.status(result.status || 400).json({ message: result.message });

        res.json({ message: result.message });
    } catch (err) {
        console.error(`Error updating User Managers (User ID: ${id}):`, err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Delete a specific User by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteUserHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await removeUser(parseInt(id));

        if (!result.success)
            return res.status( 400).json({ message: result.message });

        res.json({ message: 'User removed successfully!' });

    } catch (err) {
        console.error(`Error removing User (ID: ${id}):`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Bulk delete Users by IDs.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const bulkDeleteUsersHandler = async (req, res) => {
    try {
        const { userIds } = req.body;

        if (!userIds || !userIds.length)
            return res.status(400).json({ message: 'User IDs are missing.' });

        const result = await removeUser(userIds);

        if (!result.success)
            return res.status( 400).json({ message: result.message });

        res.json({ message: 'User removed successfully!' });

    } catch (err) {
        console.error(`Error removing Users (${req.body.userIds}):`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Router definitions
export const router = express.Router();

router.get('/', checkAuthHandler, fetchUsersHandler);
router.get('/:id', checkAuthHandler, fetchUsersHandler);
router.get('/:id/roles', checkAuthHandler, checkResourceIdHandler, fetchUserRolesHandler);
router.get('/:id/managers', checkAuthHandler, checkResourceIdHandler, fetchUserManagersHandler);
router.get('/:id/managed-users', checkAuthHandler, checkResourceIdHandler, fetchManagedUsersHandler);
router.get('/check-id/:id', checkAuthHandler, checkResourceIdHandler, checkUserIdHandler);
router.post('/', checkAuthHandler, createUserHandler);
router.post('/assignments', checkAuthHandler, updateAssignmentsHandler);
router.put('/:id', checkAuthHandler, checkResourceIdHandler, updateUserHandler);
router.put('/:id/roles', checkAuthHandler, checkResourceIdHandler, updateUserRolesHandler);
router.put('/:id/managers', checkAuthHandler, checkResourceIdHandler, updateUserManagersHandler);
router.delete('/:id', checkAuthHandler, checkResourceIdHandler,  deleteUserHandler);
router.delete('/', checkAuthHandler, bulkDeleteUsersHandler);

export default router;
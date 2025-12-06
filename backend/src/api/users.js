// BACKEND/api/users.js
import express from 'express';
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
import checkAccess from '../utils/checkAccess.js';
import checkResourceIdHandler from '../utils/checkResourceId.js';
import deleteResource from '../utils/deleteResource.js';

// API Handlers
/**
 * Fetch Users or a User by their ID.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {boolean} req.include_ppi
 * @param {boolean} req.include_configs
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
    const { id } = req.params;

    const { hasAccess } = await checkAccess(req.session.user, 'read', 'user', id);

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const falsy = [0, '0', 'false', false, 'no', 'not'];

        const users = await getUser({ 
            id,
            group: req.query.group,
            roles: !falsy.includes(req.query.roles),
            managers: !falsy.includes(req.query.managers),
            managed_users: !falsy.includes(req.query.managed_users),
            permissions: !falsy.includes(req.query.permissions),
            include_ppi: req.include_ppi,
            include_configs: req.include_configs
        });

        if (req.params.id && !users)
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
 * @param {Object} req.session
 * @param {express.Response} res
 */
const fetchUserRolesHandler = async (req, res) => {
    const { id } = req.params;

    const { hasAccess } = await checkAccess(req.session.user, 'read', 'user', id, 'role');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const managers = await getUserRoles({user: id});

        res.json(managers);

    } catch (err) {
        console.error(`Error fetching User Roles (User ID: ${id}):`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Fetch Managers for a specific User.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const fetchUserManagersHandler = async (req, res) => {
    const { id } = req.params;

    const { hasAccess } = await checkAccess(req.session.user, 'read', 'user', id, 'manager');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const managers = await getUserManagers({ user: id });

        res.json(managers);

    } catch (err) {
        console.error(`Error fetching User Managers (User ID: ${id}):`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Fetch users managed by a specific manager.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const fetchManagedUsersHandler = async (req, res) => {
    const { id } = req.params;

    const { hasAccess } = await checkAccess(req.session.user, 'read', 'manager', id, 'user');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const managedUsers = await getUserManagers({ manager: id });
        
        res.json(managedUsers);

    } catch (err) {
        console.error(`Error fetching Managed Users (Manager ID: ${id}):`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new User.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const createHandler = async (req, res) => {

    const { hasAccess } = await checkAccess(req.session.user, 'create', 'user');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const { success, message, id } = await createUser(req.body);

        if (!success)
            return res.status(400).json({ message });

        const user = await getUser({id});

        const { roles, managers } = req.body;

        if (roles && roles.length > 0)
            await updateUserRoles([id], roles.filter(id => id !== null), 'set');

        if (managers && managers.length > 0)
            await updateUserManagers([id], managers.filter(id => id !== null), 'set');

        res.status(201).json({ message, user });

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
 * @param {Object} req.session
 * @param {express.Response} res
 */
const updateHandler = async (req, res) => {
    const { id } = req.params;

    const { hasAccess } = await checkAccess(req.session.user, 'update', 'user', id);

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {

        const { roles, managers, ...userData } = req.body;

        const { success, message } = await updateUser(parseInt(id), userData);

        if (!success)
            return res.status(400).json({ message });

        const user = await getUser({id});

        if (roles != null)
            await updateUserRoles([id], roles.filter(id => id !== null), 'set');

        if (managers != null)
            await updateUserManagers([id], managers.filter(id => id !== null), 'set');

        res.json({ message, user });

    } catch (err) {
        console.error(`Error updating User (ID: ${id}):`, err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update user assignments (managers or roles).
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const updateAssignmentsHandler = async (req, res) => {
    try {
        const {resource, resourceIds, userIds, mode} = req.body;
    
        if (!userIds || !userIds.length)
            return res.status(400).json({ message: 'User IDs are missing.' });

        const { hasAccess } = await checkAccess(req.session.user, 'assign', 'user', userIds, resource, resourceIds);

        if (!hasAccess)
            return res.status(403).json({message: 'Not permitted.'});

        let success, message;

        if (resource === 'manager')
            ({ success, message } = await updateUserManagers(userIds, resourceIds, mode));

        else if (resource === 'role')
            ({ success, message } = await updateUserRoles(userIds, resourceIds, mode));

        else 
            return res.status(400).json({message: 'Unknown Resource type provided.'});

        if (!success)
            return res.status(400).json({message});

        res.json({message});

    } catch (err) {
        console.error('Error updating User assignments:', err, 'Provided data: ', req.body);
        res.status(500).json({message: 'Server error.'});
    }
};

/**
 * Delete a specific User by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteHandler = async (req, res) =>
    deleteResource(req, res, 'User', removeUser);

// Router definitions
export const router = express.Router();

router.get('/{:id}', fetchHandler);
router.get('/:id/roles', checkResourceIdHandler, fetchUserRolesHandler);
router.get('/:id/managers', checkResourceIdHandler, fetchUserManagersHandler);
router.get('/:id/managed-users', checkResourceIdHandler, fetchManagedUsersHandler);
router.get('/check-id/:id', checkResourceIdHandler, checkUserIdHandler);
router.post('/', createHandler);
router.post('/assignments', updateAssignmentsHandler);
router.put('/:id', checkResourceIdHandler, updateHandler);
router.delete('/{:id}', deleteHandler);

export default router;
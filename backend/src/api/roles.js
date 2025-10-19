// BACKEND/api/roles.js
import express from 'express';
import checkResourceIdHandler from '../utils/checkResourceId.js';
import {
    createRole,
    updateRole,
    deleteRole,
    getRole,
    getUserRoles,
} from '../controllers/users.js';
import deleteResource from '../utils/deleteResource.js';

// API Handlers
/**
 * Fetch all Roles or a Role by its ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchRolesHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const falsy = [0, '0', 'false', false, 'no', 'not'];
        const roles = await getRole({
            id,
            users: !falsy.includes(req.query.users)
        });

        if (req.params.id && !roles)
            return res.status(404).json({ message: 'Role not found.' });

        res.json(roles);

    } catch (err) {
        console.error(`Error fetching Role${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
}

/**
 * Fetch roles for a specific user.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchUsersWithRoleHandler = async (req, res) => {
    const { id } = req.params;
    
    try {
        const users = await getUserRoles({ role: id });

        res.json(users);

    } catch (err) {
        console.error('Error fetching Users with Role:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new Role.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const createRoleHandler = async (req, res) => {
    try {
        const { success, message, id } = await createRole(req.body);

        if (!success)
            return res.status(400).json({ message });

        const role = await getRole({id});

        res.status(201).json({ message, role });

    } catch (err) {
        console.error('Error creating a Role:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific Role by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateRoleHandler = async (req, res) => {
    const { id } = req.params;
    
    try {
        const { success, message } = await updateRole(parseInt(id), req.body);

        if (!success)
            return res.status(400).json({ message });

        const role = await getRole({id});

        res.json({ message, role });

    } catch (err) {
        console.error(`Error updating Role (ID: ${id}):`, err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Delete a specific Role by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteRoleHandler = async (req, res) => deleteResource(req, res, 'Role', deleteRole);

// Router definitions
export const router = express.Router();

router.get('/', fetchRolesHandler);
router.get('/:id', fetchRolesHandler);
router.get('/:id/users', checkResourceIdHandler, fetchUsersWithRoleHandler);
router.post('/', createRoleHandler);
router.put('/:id', checkResourceIdHandler, updateRoleHandler);
router.delete('/', deleteRoleHandler);
router.delete('/:id', deleteRoleHandler);

export default router;
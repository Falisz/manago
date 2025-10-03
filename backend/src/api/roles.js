// BACKEND/api/roles.js
import express from 'express';
import checkAuthHandler from '../utils/checkAuth.js';
import checkResourceIdHandler from '../utils/checkResourceId.js';
import {
    createRole,
    updateRole,
    deleteRole,
    getRole,
    getUserRoles,
} from '../controllers/users.js';

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
        const users = await getUserRoles({ id });

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
        const { name, description } = req.body;
        const result = await createRole({
            name,
            description
        });

        if (!result.success)
            return res.status(400).json({ message: result.message });

        res.status(201).json({ message: result.message, role: result.role });

    } catch (err) {
        console.error('Error creating a Role:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific role by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateRoleHandler = async (req, res) => {
    const { id } = req.params;
    
    try {
        const { name, description, icon } = req.body;

        const result = await updateRole(parseInt(id), {name, description, icon});

        if (!result.success)
            return res.status(400).json({ message: result.message });

        res.json({ message: result.message, role: result.role });

    } catch (err) {
        console.error(`Error updating Role (ID: ${id}):`, err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Delete a specific role by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteRoleHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await deleteRole(parseInt(id));

        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }

        res.json({ message: result.message });

    } catch (err) {
        console.error(`Error deleting Role (ID: ${id}):`, err);
        res.status(500).json({ message: 'Server error.' });
    }
}

// Router definitions
export const router = express.Router();

router.get('/', checkAuthHandler, fetchRolesHandler);
router.get('/:id', checkAuthHandler, fetchRolesHandler);
router.get('/:id/users', checkAuthHandler, checkResourceIdHandler, fetchUsersWithRoleHandler);
router.post('/', checkAuthHandler, createRoleHandler);
router.put('/:id', checkAuthHandler, checkResourceIdHandler, updateRoleHandler);
router.delete('/:id', checkAuthHandler, checkResourceIdHandler, deleteRoleHandler);

export default router;
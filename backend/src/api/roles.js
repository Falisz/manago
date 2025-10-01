// BACKEND/api/roles.js
import express from 'express';
import checkAuthHandler from '../utils/checkAuth.js';
import {
    createRole,
    updateRole,
    deleteRole,
    getRole,
    getUserRoles,
    updateUserRoles,
} from '../controllers/roles.js';

// API Handlers
/**
 * Fetch all roles.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchRolesHandler = async (req, res) => {
    try {
        const roles = await getRole();

        res.json(roles);
    } catch (err) {
        console.error('Error fetching roles:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Fetch a specific role by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchRoleByIdHandler = async (req, res) => {
    try {
        const { roleId } = req.params;

        if (!roleId || isNaN(roleId)) {
            return res.status(400).json({ message: 'Invalid role ID.' });
        }

        const role = await getRole({id: roleId});

        if (!role) {
            return res.status(404).json({ message: 'Role not found.' });
        }

        res.json(role);
    } catch (err) {
        console.error('Error fetching role:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Fetch roles for a specific user.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchUserRolesHandler = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const roles = await getUserRoles({userId});

        res.json(roles);
    } catch (err) {
        console.error('Error fetching roles:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new role.
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

        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }

        res.status(201).json({ message: result.message, role: result.role });
    } catch (err) {
        console.error('Error creating role:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific role by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateRoleHandler = async (req, res) => {
    try {
        const { roleId } = req.params;

        if (!roleId || isNaN(roleId)) {
            return res.status(400).json({ message: 'Invalid role ID.' });
        }

        const { name, description } = req.body;

        const result = await updateRole(parseInt(roleId), {name, description});

        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }

        res.json({ message: result.message, role: result.role });
    } catch (err) {
        console.error('Error updating role:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update roles for a specific user.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateUserRolesHandler = async (req, res) => {
    try {
        const { userId } = req.params;
        const { roleIds } = req.body;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

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
 * Delete a specific role by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteRoleHandler = async (req, res) => {
    try {
        const { roleId } = req.params;

        if (!roleId || isNaN(roleId)) {
            return res.status(400).json({ message: 'Invalid role ID.' });
        }

        const result = await deleteRole(parseInt(roleId));

        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }

        res.json({ message: result.message });
    } catch (err) {
        console.error('Error deleting role:', err);
        res.status(500).json({ message: 'Server error.' });
    }
}

// Router definitions
export const router = express.Router();

router.get('/', checkAuthHandler, fetchRolesHandler);
router.get('/:roleId', checkAuthHandler, fetchRoleByIdHandler);
router.get('/user/:userId', checkAuthHandler, fetchUserRolesHandler);
router.post('/', checkAuthHandler, createRoleHandler);
router.put('/:roleId', checkAuthHandler, updateRoleHandler);
router.put('/user/:userId', checkAuthHandler, updateUserRolesHandler);
router.delete('/:roleId', checkAuthHandler, deleteRoleHandler);

export default router;
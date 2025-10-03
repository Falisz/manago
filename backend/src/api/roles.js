// BACKEND/api/roles.js
import express from 'express';
import checkAuthHandler from '../utils/checkAuth.js';
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
 * @param {express.Request} _req
 * @param {express.Response} res
 */
const fetchRolesHandler = async (req, res) => {
    try {
        const falsy = [0, '0', 'false', false, 'no', 'not'];
        const roles = await getRole({
            id: req.params.roleId,
            users: falsy.includes(req.query.users) ? false : true
        });

        if (req.params.roleId && !roles)
            return res.status(404).json({ message: 'Role not found.' });

        res.json(roles);
    } catch (err) {
        console.error('Error fetching roles:', err);
        res.status(500).json({ message: 'Server error.' });
    }
}

/**
 * Fetch roles for a specific user.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchUsersWithRoleHandler = async (req, res) => {
    try {
        const { roleId } = req.params;

        if (!roleId)
            return res.status(400).json({ message: 'Role ID is missing.' });

        if (isNaN(roleId))
            return res.status(400).json({ message: 'Invalid Role ID.' });
        
        const users = await getUserRoles({roleId});

        res.json(users);
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

        const { name, description, icon } = req.body;

        const result = await updateRole(parseInt(roleId), {name, description, icon});

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
router.get('/:roleId', checkAuthHandler, fetchRolesHandler);
router.get('/:roleId/users', checkAuthHandler, fetchUsersWithRoleHandler);
router.post('/', checkAuthHandler, createRoleHandler);
router.put('/:roleId', checkAuthHandler, updateRoleHandler);
router.delete('/:roleId', checkAuthHandler, deleteRoleHandler);

export default router;
// BACKEND/api/branches.js
import express from 'express';
import {
    getBranch,
    createBranch,
    updateBranch,
    deleteBranch,
    updateBranchUsers,
    getBranchUsers
} from '#controllers';
import checkResourceIdHandler from '#middleware/checkResourceId.js';
import deleteResource from '#utils/deleteResource.js';

// API Handlers
/**
 * Fetch multiple Branches or one by its ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const branches = await getBranch({
            id,
            get_members: req.query.get_members !== 'false'
        });

        if (req.params.id && !branches)
            return res.status(404).json({ message: 'Branch not found.' });

        res.json(branches);
    } catch (err) {
        console.error(`Error fetching Branch${id ? ' (ID: ' + id + ')' : 'es'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Fetch Users for a specific branch.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchUsersHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const users = await getBranchUsers(
            parseInt(id),
            req.query.role != null ? parseInt(req.query.role) : null,
            req.query.include_details !== 'false'
        );

        res.json(users);
    } catch (err) {
        console.error('Error fetching Branch Users:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new Branch.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const createHandler = async (req, res) => {
    try {
        const { success, message, id } = await createBranch(req.body);

        if (!success)
            return res.status(400).json({ message });

        const branch = await getBranch({ id });

        const { leader_ids, manager_ids } = req.body;

        if (manager_ids && manager_ids.length > 0) {
            const branchManagers = manager_ids.filter(id => id !== null);
            await updateBranchUsers([id], branchManagers, 2, 'add');
        }

        if (leader_ids && leader_ids.length > 0) {
            const branchLeaders = leader_ids.filter(id => id !== null);
            await updateBranchUsers([id], branchLeaders, 1, 'add');
        }

        res.status(201).json({ message, branch });
    } catch (err) {
        console.error('Error creating a Branch:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific Branch by its ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const { name, description, active, location, founding_date, data, members, leaders, managers } = req.body;

        const { success, message } = await updateBranch(parseInt(id), {
            name,
            description,
            active,
            location,
            founding_date,
            data
        });

        if (!success)
            return res.status(400).json({ message });

        const branch = await getBranch({ id });

        if (managers != null)
            await updateBranchUsers([id], managers.filter(id => id !== null), 2, 'set');

        if (leaders != null)
            await updateBranchUsers([id], leaders.filter(id => id !== null), 1, 'set');

        if (members != null)
            await updateBranchUsers([id], members.filter(id => id !== null), 0, 'set');

        res.json({ success, branch });
    } catch (err) {
        console.error(`Error updating Branch (ID: ${id}):`, err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update Branch assignments (Managers or Leaders).
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateAssignmentsHandler = async (req, res) => {
    try {
        const { resource, resourceIds, branchIds, role, mode } = req.body;

        if (!branchIds || !branchIds.length)
            return res.status(400).json({ message: 'Branch IDs are missing.' });

        let success, message;

        if (resource === 'user')
            ({ success, message } = await updateBranchUsers(branchIds, resourceIds, role, mode));
        else
            return res.status(400).json({ message: 'Unknown Resource type provided.' });

        if (!success)
            return res.status(400).json({ message });

        res.json({ message });
    } catch (err) {
        console.error('Error updating Branch assignments:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Delete a specific Branch by its ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteHandler = async (req, res) =>
    deleteResource(req, res, 'Branch', deleteBranch);

// Router definitions
export const router = express.Router();

router.get('/{:id}', fetchHandler);
router.get('/:id/users', checkResourceIdHandler, fetchUsersHandler);
router.post('/', createHandler);
router.post('/assignments', updateAssignmentsHandler);
router.put('/:id', checkResourceIdHandler, updateHandler);
router.delete('/{:id}', deleteHandler);

export default router;
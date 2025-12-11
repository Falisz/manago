// BACKEND/api/leaveTypes.js
import express from 'express';
import {
    getLeaveType,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType
} from '../controllers/workPlanner.js';
import checkAccess from '../utils/checkAccess.js';
import checkResourceIdHandler from './checkResourceId.js';
import deleteResource from '../utils/deleteResource.js';

// API Handlers
/**
 * Fetch multiple Absence Types or one by its ID.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
    const { id } = req.params;
    const query = {};
    try {
        if (id) {
            const { hasAccess } = await checkAccess(req.user, 'read', 'leave-type', id);

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});

            query.id = id;
        }

        const job_posts = await getLeaveType(query);

        if (id && !job_posts)
            return res.status(404).json({ message: 'Request Status not found.' });

        res.json(job_posts);

    } catch (err) {
        console.error(`Error fetching Leave Type${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new Absence Type.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const createHandler = async (req, res) => {

    const { hasAccess } = await checkAccess(req.user, 'create', 'leave-type');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const data = req.body;

        const { success, message, id } = await createLeaveType(data);

        if (!success)
            return res.status(400).json({ message });

        const holiday = await getLeaveType({id});

        res.status(201).json({ message, holiday });

    } catch (err) {
        console.error('Error creating a Holiday:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific Absence Type.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const updateHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const data = req.body;

        const { hasAccess } = await checkAccess(req.user, 'update', 'holiday', id);

        if (!hasAccess)
            return res.status(403).json({message: 'Not permitted.'});

        const { success, message } = await updateLeaveType(parseInt(id), data);

        if (!success)
            return res.status(400).json({ message });

        const holiday = await getLeaveType({id});

        res.json({ message, holiday });

    } catch (err) {
        console.error(`Error updating Holiday (ID: ${id}):`, err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Delete a specific Absence Type or multiple Absence Types.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteHandler = async (req, res) =>
    deleteResource(req, res, 'Absence Type', deleteLeaveType);

// Router definitions
export const router = express.Router();

router.get('/{:id}', fetchHandler);
router.post('/', createHandler);
router.put('/:id', checkResourceIdHandler, updateHandler);
router.delete('/{:id}', deleteHandler);

export default router;
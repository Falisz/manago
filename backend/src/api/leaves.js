// BACKEND/api/leaves.js
import express from 'express';
import checkResourceIdHandler from '../utils/checkResourceId.js';
import checkAccess from '../utils/checkAccess.js';
import deleteResource from '../utils/deleteResource.js';
import {
    getLeave,
    createLeave,
    updateLeave,
    deleteLeave
} from '../controllers/workPlanner.js';

// API Handlers
/**
 * Fetch a Leave or multiple Leaves.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const fetchLeavesHandler = async (req, res) => {
    const { id } = req.params;

    const { hasAccess } = await checkAccess(req.session.user, 'read', 'leave', id);

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const leaves = await getLeave({
            id: id != null ? parseInt(id) : undefined,
            user: req.body.user ? req.body.user :
                req.query.user != null ? parseInt(req.query.user) : undefined,
            approver: req.body.approver ? req.body.approver :
                req.query.approver != null ? parseInt(req.query.approver) : undefined,
            date: req.body.date ? new Date(req.body.date) :
                req.query.date ? new Date(req.query.date) : undefined,
            start_date: req.body.start_date ? new Date(req.body.start_date) :
                req.query.start_date ? new Date(req.query.start_date) : undefined,
            end_date: req.body.end_date ? new Date(req.body.end_date) :
                req.query.end_date ? new Date(req.query.end_date) : undefined,
        });

        if (id && !leaves)
            return res.status(404).json({ message: 'Leave not found.' });

        res.json(leaves);

    } catch (err) {
        console.error(`Error fetching Leave${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a Leave or multiple Leaves.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const createLeaveHandler = async (req, res) => {

    const { hasAccess } = await checkAccess(req.session.user, 'create', 'leave');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        let { leave } = req.body;
    
        const { success, message, id } = await createLeave(leave);

        if (!success)
            return res.status(400).json({ message });

        leave = await getLeave({id});

        res.status(201).json({ message, leave });

    } catch (err) {
        console.error('Error creating a Leave:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific Leave or multiple Leaves.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const updateLeaveHandler = async (req, res) => {
    const { id } = req.params;

    try {
        if (!id) {
            let { leaves } = req.body;

            const {
                hasAccess, 
                hasFullAccess,
                allowedIds,
                forbiddenIds 
            } = await checkAccess(req.session.user, 'update', 'leave', Object.keys(leaves));

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});
            
            const errorMessages = [];

            if (!hasFullAccess) {
                leaves = Object.entries(leaves).filter( (id, _leave) => allowedIds.contains(id));
                
                errorMessages.push(`You are not permitted to update Leave${forbiddenIds.size > 1 ? 's with IDs:' : ' with ID:'} ${forbiddenIds.join(', ')}.`);
            }

            const updatedLeaves = [];

            for (const [id, leave] of Object.entries(leaves)) {
                const { success, message } = await updateLeave(parseInt(id), leave);

                if (success)
                    updatedLeaves.push(await getLeave({ id }));

                else
                    errorMessages.push(message);
            }

            res.status(201).json({ message: `Updated ${updatedLeaves.length()} Leaves.`, updatedLeaves, errorMessages})

        } else {
            let { leave } = req.body;

            const { hasAccess } = await checkAccess(req.session.user, 'update', 'leave', id);

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});

            const { success, message } = await updateLeave(parseInt(id), leave);
            
            if (!success)
                return res.status(400).json({ message });
    
            leave = await getLeave({id});
    
            res.json({ message, leave });
        }
    } catch (err) {
        console.error('Error updating a Shift:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Delete a specific Shift or multiple Shifts.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteLeaveHandler = async (req, res) => deleteResource(req, res, 'Leave', deleteLeave);

// Router definitions
export const router = express.Router();

router.get('/', fetchLeavesHandler);
router.get('/:id', fetchLeavesHandler);
router.post('/batch', fetchLeavesHandler);
router.post('/', createLeaveHandler);
router.put('/', updateLeaveHandler);
router.put('/:id', checkResourceIdHandler, updateLeaveHandler);
router.delete('/', deleteLeaveHandler);
router.delete('/:id', deleteLeaveHandler);

export default router;
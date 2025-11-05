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
import {getUsersByScope} from "../controllers/users.js";

// API Handlers
/**
 * Fetch a Leave or multiple Leaves.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const fetchLeavesHandler = async (req, res) => {
    const { id } = req.params;
    let query = {};
    let users = [];

    if (id) {
        const { hasAccess } = await checkAccess(req.session.user, 'read', 'leave', id);

        if (!hasAccess)
            return res.status(403).json({message: 'Not permitted.'});

        query.id = id;
    } else {

        if (req.query.user) {
            query.user = parseInt(req.query.user);
        } else if (req.query.user_scope) {

            const scope = req.query.user_scope;
            const scope_id = scope === 'you' ? req.session.user : req.query.user_scope_id;

            users = await getUsersByScope({scope, scope_id});

            if (!users)
                return res.status(404).json({message: 'Users not found.'});

            if (!Array.isArray(users))
                users = [users];

            query.user = users.map(user => user.id);
        }

        if (req.query.date) {
            query.date = req.query.date;
        } else {
            if (req.query.start_date)
                query.from = req.query.start_date;

            if (req.query.end_date)
                query.to = req.query.end_date;
        }

        if (req.query.approver)
            query.approver = parseInt(req.query.approver);
    }

    try {
        const leaves = await getLeave(query);

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
const deleteLeaveHandler = async (req, res) =>
    deleteResource(req, res, 'Leave', deleteLeave);

// Router definitions
export const router = express.Router();

router.get('/', fetchLeavesHandler);
router.get('/:id', fetchLeavesHandler);
router.post('/', createLeaveHandler);
router.put('/', updateLeaveHandler);
router.put('/:id', checkResourceIdHandler, updateLeaveHandler);
router.delete('/', deleteLeaveHandler);
router.delete('/:id', deleteLeaveHandler);

export default router;
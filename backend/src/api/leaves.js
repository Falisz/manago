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
        let leave = req.body;
    
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
            let { ids, data } = req.body;

            if (!ids)
                return res.status(400).json({message: 'Missing IDs.'});

            if (!data)
                return res.status(400).json({message: 'Missing data.'});

            let action = 'update';

            if (data.status === 2)
                action = 'approve';
            else if (data.status === 3)
                action = 'reject';
            else if (data.status === 4)
                action = 'request-cancellation';

            const {
                hasAccess, 
                hasFullAccess,
                allowedIds,
                forbiddenIds 
            } = await checkAccess(req.session.user, action, 'leave', ids);

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});
            
            const warning = [];

            if (!hasFullAccess) {
                ids = Array.from(allowedIds);
                
                warning.push(`You are not permitted to ${action} Leave${forbiddenIds.length > 1 ?
                     's with IDs:' : ' with ID:'} ${forbiddenIds.join(', ')}.`);
            }

            const updated = [];

            for (const id of ids) {
                const { success, message } = await updateLeave(parseInt(id), data);

                if (success)
                    updated.push(await getLeave({ id }));
                else
                    warning.push(message);
            }

            const done = action === 'update' ? 'Updated' :
                         action === 'approve' ? 'Approved' :
                         action === 'reject' ? 'Rejected' :
                         action === 'request-cancellation' ? 'Cancellation requested' : 
                         'Processed';

            res.status(201).json({ message: `${done} ${updated.length} Leaves.`, updated, warning})

        } else {
            const data = req.body;
            let action = 'update';

            if (data.status === 2)
                action = 'approve';
            else if (data.status === 3)
                action = 'reject';
            else if (data.status === 4)
                action = 'request-cancellation';

            const { hasAccess } = await checkAccess(req.session.user, action, 'leave', id);

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});

            const { success, message } = await updateLeave(parseInt(id), data);
            
            if (!success)
                return res.status(400).json({ message });

            const leave = await getLeave({id});
    
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
// BACKEND/api/leaves.js
import express from 'express';
import {
    getAbsence,
    getAbsenceBalance,
    getLeaveType,
    createAbsence,
    updateAbsence,
    deleteAbsence
} from '../controllers/workPlanner.js';
import {getUsersByScope} from "../controllers/users.js";
import checkAccess from '../utils/checkAccess.js';
import checkResourceIdHandler from './checkResourceId.js';
import deleteResource from '../utils/deleteResource.js';

// API Handlers
/**
 * Fetch multiple Leaves or one by its ID.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
    const { id } = req.params;
    let query = {};
    let users = [];

    if (id) {
        const { hasAccess } = await checkAccess(req.user, 'read', 'leave', id);

        if (!hasAccess)
            return res.status(403).json({message: 'Not permitted.'});

        query.id = parseInt(id);
    } else {
        if (req.query.user) {
            query.user = parseInt(req.query.user);
        } else if (req.query.user_scope) {

            const scope = req.query.user_scope;
            const scope_id = scope === 'you' ? req.user : req.query.user_scope_id;

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
        const leaves = await getAbsence(query);

        if (id && !leaves)
            return res.status(404).json({ message: 'Absence not found.' });

        res.json(leaves);

    } catch (err) {
        console.error(`Error fetching Leave${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new Absence.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const createHandler = async (req, res) => {
    const data = req.body;

    const { hasAccess } = await checkAccess(req.user, 'create', 'leave');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        if (data.user == null) data.user = req.user;
        if (data.status == null) data.status = 0;

        if (data.start_date && data.end_date) {
            const start = new Date(data.start_date);
            const end = new Date(data.end_date);

            if (!isNaN(start) && !isNaN(end)) {
                const diffInMs = end - start;
                data.days = Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1;
            }
        } else {
            data.days = 1;
        }
    
        const { success, message, id } = await createAbsence(data);

        if (!success)
            return res.status(400).json({ message });

        const leave = await getAbsence({id});

        res.status(201).json({ message, leave });

    } catch (err) {
        console.error('Error creating a Absence:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific Absence or multiple Leaves.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const updateHandler = async (req, res) => {
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
            } = await checkAccess(req.user, action, 'leave', ids);

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
                const { success, message } = await updateAbsence(parseInt(id), data);

                if (success)
                    updated.push(await getAbsence({ id }));
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

            const { hasAccess } = await checkAccess(req.user, action, 'leave', id);

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});

            const { success, message } = await updateAbsence(parseInt(id), data);
            
            if (!success)
                return res.status(400).json({ message });

            const leave = await getAbsence({id});
    
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
const deleteHandler = async (req, res) =>
    deleteResource(req, res, 'Absence', deleteAbsence);

/**
 * Fetch the balance of all absence types for a specific user and year.
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const fetchBalanceHandler = async (req, res) => {
    const result = {};
    try {
        const leaveTypes = await getLeaveType();
        const userId = req.query.user || req.user;
        const year = req.query.year || new Date().getFullYear();
        for (const leaveType of leaveTypes) {
            const typeId = leaveType?.id;
            if (typeId) result[typeId] = await getAbsenceBalance({userId, typeId, year});
        }

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error.'});
    }
}

// Router definitions
export const router = express.Router();

router.get('/balance', fetchBalanceHandler);
router.get('/{:id}', fetchHandler);
router.post('/', createHandler);
router.put('/', updateHandler);
router.put('/:id', checkResourceIdHandler, updateHandler);
router.delete('/{:id}', deleteHandler);

export default router;
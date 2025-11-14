// BACKEND/api/shifts.js
import express from 'express';
import checkAccess from '../utils/checkAccess.js';
import checkResourceIdHandler from '../utils/checkResourceId.js';
import deleteResource from '../utils/deleteResource.js';
import {
    getShift,
    createShift,
    updateShift,
    deleteShift
} from '../controllers/workPlanner.js';
import {getUsersByScope} from "../controllers/users.js";

// API Handlers
/**
 * Fetch a Shift or multiple Shifts.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const fetchShiftsHandler = async (req, res) => {
    const { id } = req.params;
    let query = {};
    let users = [];

    try {

        if (id) {
            const { hasAccess } = await checkAccess(req.session.user, 'read', 'shift', id);

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

            if (req.query.schedule === 'null')
                query.schedule = null;
            else if (req.query.schedule)
                query.schedule = parseInt(req.query.schedule);

            if (req.query.job_post)
                query.job_post = parseInt(req.query.job_post);
        }

        const shifts = await getShift(query);

        if (id && !shifts)
            return res.status(404).json({ message: 'Shift not found.' });

        res.json(shifts);

    } catch (err) {
        console.error(`Error fetching Shift${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new Shift or multiple Shifts.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const createShiftHandler = async (req, res) => {

    const { hasAccess } = await checkAccess(req.session.user, 'create', 'shift');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const { shifts } = req.body;

        if (shifts && Array.isArray(shifts)) {
            const newShifts = [];
            const errorMessages = [];

            for (const shift of shifts) {
                const { success, message, id } = await createShift(shift);

                if (success)
                    newShifts.push(await getShift({id}));
                else
                    errorMessages.push(message);
            }

            res.status(201).json({ message: `Created ${newShifts.length} new shifts.`, newShifts, errorMessages})

        } else {
            let { shift } = req.body;
        
            const { success, message, id } = await createShift(shift);

            if (!success)
                return res.status(400).json({ message });

            shift = await getShift({id});

            res.status(201).json({ message, shift });
        }

    } catch (err) {
        console.error('Error creating a Shift:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific Shift or multiple Shifts.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const updateShiftHandler = async (req, res) => {
    const { id } = req.params;

    try {
        if (!id) {
            let { shifts } = req.body;

            const {
                hasAccess, 
                hasFullAccess,
                allowedIds,
                forbiddenIds 
            } = await checkAccess(req.session.user, 'update', 'shift', Object.keys(shifts));

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});

            const errorMessages = [];

            if (!hasFullAccess) {            
                shifts = Object.entries(shifts).filter( (id, _shift) => allowedIds.contains(id));
                
                errorMessages.push(`You are not permitted to update ${'Shift' + (forbiddenIds.size > 1 ? 's with IDs:' : ' with ID:')} ${forbiddenIds.join(', ')}.`);
            }

            const updatedShifts = [];

            for (const [id, shift] of Object.entries(shifts)) {
                const { success, message } = await updateShift(parseInt(id), shift);

                if (success)
                    updatedShifts.push(await getShift({ id }));
                
                else
                    errorMessages.push(message);
            }

            res.status(201).json({ message: `Updated ${updatedShifts.length} shifts.`, updatedShifts, errorMessages})

        } else {
            let { shift } = req.body;

            const { hasAccess } = await checkAccess(req.session.user, 'update', 'shift', id);

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});

            const { success, message } = await updateShift(parseInt(id), shift);
            
            if (!success)
                return res.status(400).json({ message });
    
            shift = await getShift({id});
    
            res.json({ message, shift });
        }
    } catch (err) {
        console.error('Error updating a Shift:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Delete a specific Shift by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteShiftHandler = async (req, res) =>
    deleteResource(req, res, 'Shift', deleteShift);

// Router definitions
export const router = express.Router();

router.get('/', fetchShiftsHandler);
router.get('/:id', fetchShiftsHandler);
router.post('/', createShiftHandler);
router.put('/', updateShiftHandler);
router.put('/:id', checkResourceIdHandler, updateShiftHandler);
router.delete('/', deleteShiftHandler);
router.delete('/:id', deleteShiftHandler);

export default router;
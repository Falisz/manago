// BACKEND/api/shifts.js
import express from 'express';
import checkResourceIdHandler from '../utils/checkResourceId.js';
import {
    getShift,
    createShift,
    updateShift,
    deleteShift
} from "../controllers/workPlanner.js";

// API Handlers
/**
 * Fetch a Shift or multiple Shifts.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchShiftsHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const shifts = await getShift({
            id: id != null ? parseInt(id) : undefined,
            date: req.body.date ? req.body.date :
                req.query.date != null ? req.query.date : undefined,
            user: req.body.user ? req.body.user :
                req.query.user != null ? parseInt(req.query.user) : undefined,
            job_post: req.body.job_post ? req.body.job_post :
                req.query.job_post != null ? parseInt(req.query.job_post) : undefined,
            schedule: req.body.schedule ? req.body.schedule :
                req.query.schedule != null ? parseInt(req.query.schedule) : undefined,
            start_time: req.body.start_date ? new Date(req.body.start_date) :
                req.query.start_date ? new Date(req.query.start_date) : undefined,
            end_time: req.body.end_date ? new Date(req.body.end_date+'T23:59') :
                req.query.end_date ? new Date(req.query.end_date+'T23:59') : undefined,
        });

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
 * @param {express.Response} res
 */
const createShiftHandler = async (req, res) => {
    try {
        const { shifts } = req.body;

        if (shifts && Array.isArray(shifts)) {
            const newShifts = [];
            const errorMessages = [];

            shifts.forEach(async shift => {
                const { success, message, id } = await createShift(shift);

                if (success)
                    newShifts.push(await getShift({id}));
                else
                    errorMessages.push(message);
            });

            res.status(201).json({ message: `Created ${newShifts.length()} new shifts.`, newShifts, errors})

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
 * @param {express.Response} res
 */
const updateShiftHandler = async (req, res) => {
    const { id } = req.params;

    try {
        if (!id) {
            const { shifts } = req.body;
            
            const updatedShifts = [];
            const errorMessages = [];

            Object.fromEntries(shifts).forEach(async (id, shift) => {
                const { success, message } = await updateShift(parseInt(id), shift);

                if (success)
                    updatedShifts.push(await getShift({id}));
                else
                    errorMessages.push(message);
            });

            res.status(201).json({ message: `Updated ${updatedShifts.length()} shifts.`, updatedShifts, errors})

        } else {
            let { shift } = req.body;

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
const deleteShiftHandler = async (req, res) => {
    const { id = null } = req.params;
    const { ids = null } = req.body;

    try {
        if (id) {
            const { success, message, deletedCount } = await deleteShift(parseInt(id));

            if (!success)
                return res.status( 400).json({ message });

            res.json({ message, deletedCount });

        } else if (ids && ids.length > 0) {
            const { success, message, deletedCount } = await deleteShift(ids);

            if (!success)
                return res.status(400).json({ message });

            res.json({ message, deletedCount });

        } else {
            return res.status(400).json({ message: 'Shift IDs are missing.' });
        }

    } catch (err) {
        if (id)
            console.error(`Error deleting Shift (ID: ${id}:`, err);
        else if (ids)
            console.error(`Error deleting Shifts (${ids}):`, err);

        res.status(500).json({ message: 'Server error.' });
    }
};

// Router definitions
export const router = express.Router();

router.get('/', fetchShiftsHandler);
router.get('/:id', fetchShiftsHandler);
router.post('/batch', fetchShiftsHandler);
router.post('/', createShiftHandler);
router.put('/', updateShiftHandler);
router.put('/:id', checkResourceIdHandler, updateShiftHandler);
router.delete('/', deleteShiftHandler);
router.delete('/:id', checkResourceIdHandler, deleteShiftHandler);

export default router;
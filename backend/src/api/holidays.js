// BACKEND/api/holidays.js
import express from 'express';
import checkAuthHandler from '../utils/checkAuth.js';
import checkResourceIdHandler from '../utils/checkResourceId.js';
import {
    getHoliday,
    createHoliday,
    updateHoliday,
    deleteHoliday,
} from '../controllers/workPlanner.js';

// API Handlers
/**
 * Fetch all Holidays or a Holiday by its ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchHolidaysHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const holidays = await getHoliday({
            id,
            start_date: req.query.start_date,
            end_date: req.query.start_date
        });

        if (req.params.id && !holidays)
            return res.status(404).json({ message: 'Holiday not found.' });

        res.json(holidays);
    } catch (err) {
        console.error(`Error fetching Holiday${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new Holiday.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const createHolidayHandler = async (req, res) => {
    try {
        const { success, message, id} = await createHoliday(req.body);

        if (!success)
            return res.status(400).json({ message });

        const holiday = await getHoliday({id});

        res.status(201).json({ message, holiday });

    } catch (err) {
        console.error('Error creating a Holiday:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific Holiday by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateHolidayHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const { date, name, requestable_working } = req.body;

        const { success, message } = await updateHoliday(parseInt(id), {date, name, requestable_working});

        if (!success)
            return res.status(400).json({ message });

        const holiday = await getHoliday({id});

        res.json({ message, holiday });

    } catch (err) {
        console.error(`Error updating Holiday (ID: ${id}):`, err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Delete a specific Holiday by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteHolidayHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const { success, message, deletedCount} = await deleteHoliday(parseInt(id));

        if (!success)
            return res.status(400).json({ message });

        res.json({ message, deletedCount });

    } catch (err) {
        console.error(`Error deleting Holiday (ID: ${id}):`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Router definitions
export const router = express.Router();

router.get('/', checkAuthHandler, fetchHolidaysHandler);
router.get('/:id', checkAuthHandler, fetchHolidaysHandler);
router.post('/', checkAuthHandler, createHolidayHandler);
router.put('/:id', checkAuthHandler, checkResourceIdHandler, updateHolidayHandler);
router.delete('/:id', checkAuthHandler, checkResourceIdHandler, deleteHolidayHandler);

export default router;
// BACKEND/api/holidays.js
import express from 'express';
import {
    getHoliday,
    createHoliday,
    updateHoliday,
    deleteHoliday,
} from '../controllers/workPlanner.js';
import checkAccess from "../utils/checkAccess.js";
import checkResourceIdHandler from './checkResourceId.js';
import deleteResource from '../utils/deleteResource.js';

// API Handlers
/**
 * Fetch multiple Holidays or one by its ID.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
    const { id } = req.params;
    let query = {};

    try {
        if (id) {
            const { hasAccess } = await checkAccess(req.user, 'read', 'holiday', id);

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});

            query.id = parseInt(id);

        } else {
            if (req.query.date) {
                query.date = req.query.date;
            } else {
                if (req.query.start_date)
                    query.from = req.query.start_date;
                if (req.query.end_date)
                    query.to = req.query.end_date;
            }
        }

        const holidays = await getHoliday(query);

        if (id && !holidays)
            return res.status(404).json({ message: 'Holiday not found.' });

        if (id && Array.isArray(holidays))
            return res.json(holidays[0]);

        res.json(holidays);

    } catch (err) {
        console.error(`Error fetching Holiday${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new Holiday.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const createHandler = async (req, res) => {

    const { hasAccess } = await checkAccess(req.user, 'create', 'holiday');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const data = req.body;

        const { success, message, id } = await createHoliday(data);

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

        const { success, message } = await updateHoliday(parseInt(id), data);

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
const deleteHandler = async (req, res) =>
    deleteResource(req, res, 'Holiday', deleteHoliday);

// Router definitions
export const router = express.Router();

router.get('/{:id}', fetchHandler);
router.post('/', createHandler);
router.put('/:id', checkResourceIdHandler, updateHandler);
router.delete('/{:id}', deleteHandler);

export default router;
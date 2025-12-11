// BACKEND/api/holidayWorkings.js
import express from 'express';
import {
    getHolidayWorking,
    createHolidayWorking,
    updateHolidayWorking,
    deleteHolidayWorking, getWeekendWorking,
} from '../controllers/workPlanner.js';
import checkAccess from '../utils/checkAccess.js';
import checkResourceIdHandler from './checkResourceId.js';
import deleteResource from '../utils/deleteResource.js';
import {getUser} from "../controllers/users.js";

// API Handlers
/**
 * Fetch multiple Holiday Working Agreements or one by its ID.
 * @param {express.Request} req
 * @param {object} req.query
 * @param {number} req.query.user
 * @param {number} req.query.managed
 * @param {number} req.query.holiday
 * @param {number} req.user
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
    const { id } = req.params;

    const { hasAccess } = await checkAccess(req.user, 'read', 'holiday-working', id);

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        if (id) {
            const result = await getWeekendWorking({ id: parseInt(id) });

            if (!result)
                return res.status(404).json({ message: 'Holiday Working Agreement not found.' });

            return res.json(result);
        }

        const { hasAccess } = await checkAccess(req.user, 'read', 'holiday-working');

        if (!hasAccess)
            return res.status(403).json({ message: 'Not permitted.' });

        const query = {};

        if (req.query.user)
            query.user = parseInt(req.query.user);

        if (req.query.managed)
            query.user = getUser({scope: 'manager', scope_id: parseInt(req.query.managed)})

        if (req.query.holiday)
            query.holiday = parseInt(req.query.holiday);

        const result = await getHolidayWorking(query);

        if (id && Array.isArray(result))
            return res.json(result[0]);

        res.json(result);

    } catch (err) {
        console.error(`Error fetching Holiday Working Agreement${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new Holiday Working Agreement.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const createHandler = async (req, res) => {

    const { hasAccess } = await checkAccess(req.user, 'create', 'holiday-working');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const data = req.body;

        const { success, message, id } = await createHolidayWorking(data);

        if (!success)
            return res.status(400).json({ message });

        const holidayWorking = await getHolidayWorking({id});

        res.status(201).json({ message, holidayWorking });

    } catch (err) {
        console.error('Error creating a Holiday:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific Holiday Working Agreement by its ID.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const updateHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const data = req.body;

        const { hasAccess } = await checkAccess(req.user, 'update', 'holiday-working', id);

        if (!hasAccess)
            return res.status(403).json({message: 'Not permitted.'});

        const { success, message } = await updateHolidayWorking(parseInt(id), data);

        if (!success)
            return res.status(400).json({ message });

        const holiday = await getHolidayWorking({id});

        res.json({ message, holiday });

    } catch (err) {
        console.error(`Error updating Holiday (ID: ${id}):`, err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Delete a specific Holiday Working Agreement by its ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteHandler = async (req, res) =>
    deleteResource(req, res, 'Holiday Working', deleteHolidayWorking);

// Router definitions
export const router = express.Router();

router.get('/{:id}', fetchHandler);
router.post('/', createHandler);
router.put('/:id', checkResourceIdHandler, updateHandler);
router.delete('/{:id}', deleteHandler);

export default router;
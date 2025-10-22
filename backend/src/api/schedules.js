// BACKEND/api/schedules.js
import express from 'express';
import checkAccess from '../utils/checkAccess.js';
import checkResourceIdHandler from '../utils/checkResourceId.js';
import deleteResource from '../utils/deleteResource.js';
import {
    getSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule
} from "../controllers/workPlanner.js";

// API Handlers
/**
 * Fetch a Working Schedule or multiple Working Schedules.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchScheduleHandler = async (req, res) => {
    const { id } = req.params;

    const { hasAccess } = await checkAccess(req.session.user, 'read', 'schedule', id);

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const schedules = await getSchedule({
            id: id != null ? parseInt(id) : undefined,
            author: req.body.author ? req.body.author :
                req.query.author != null ? parseInt(req.query.author) : undefined,
            start_date: req.body.start_date ? new Date(req.body.start_date) :
                req.query.start_date ? new Date(req.query.start_date) : undefined,
            end_date: req.body.end_date ? new Date(req.body.end_date+'T23:59') :
                req.query.end_date ? new Date(req.query.end_date+'T23:59') : undefined,
            include_shifts: req.query.include_shifts ? true : false,
        });

        if (id && !schedules)
            return res.status(404).json({ message: 'Schedule not found.' });

        res.json(schedules);

    } catch (err) {
        console.error(`Error fetching Working Schedule${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new Working Schedule.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const createScheduleHandler = async (req, res) => {

    const { hasAccess } = await checkAccess(req.session.user, 'create', 'schedule');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        let { schedule } = req.body;
        
        const { success, message, id } = await createSchedule(schedule);

        if (!success)
            return res.status(400).json({ message });

        schedule = await getSchedule({ id });

        res.status(201).json({ message, schedule });

    } catch (err) {
        console.error('Error creating a Working Schedule:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific Working Schedule.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateScheduleHandler = async (req, res) => {
    const { id } = req.params;

    const { hasAccess } = await checkAccess(req.session.user, 'update', 'schedule', id);

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});
    
    try {
        let { schedule } = req.body;

        const { success, message } = await updateSchedule(parseInt(id), schedule);
        
        if (!success)
            return res.status(400).json({ message });

        schedule = await getSchedule({id});

        res.json({ message, schedule });
        
    } catch (err) {
        console.error('Error updating a Schedule:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Delete a specific Working Schedule by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteScheduleHandler = async (req, res) => deleteResource(req, res, 'Schedule', deleteSchedule, req.query.delete_shifts === 'true');

// Router definitions
export const router = express.Router();

router.get('/', fetchScheduleHandler);
router.get('/:id', fetchScheduleHandler);
router.post('/batch', fetchScheduleHandler);
router.post('/', createScheduleHandler);
router.put('/', updateScheduleHandler);
router.put('/:id', checkResourceIdHandler, updateScheduleHandler);
router.delete('/', deleteScheduleHandler);
router.delete('/:id', deleteScheduleHandler);

export default router;
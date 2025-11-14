// BACKEND/api/schedules.js
import express from 'express';
import checkAccess from '../utils/checkAccess.js';
import checkResourceIdHandler from '../utils/checkResourceId.js';
import deleteResource from '../utils/deleteResource.js';
import {
    getSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    createShift,
    updateShift,
    deleteShift
} from '../controllers/workPlanner.js';

// API Handlers
/**
 * Fetch a Working Schedule or multiple Working Schedules.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
    const { id } = req.params;

    const { hasAccess } = await checkAccess(req.session.user, 'read', 'schedule', id);

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const schedules = await getSchedule({
            id: id != null ? parseInt(id) : undefined,
            author: req.query.author != null ? parseInt(req.query.author) : undefined,
            start_date: req.query.start_date ? new Date(req.query.start_date) : undefined,
            end_date: req.query.end_date ? new Date(req.query.end_date+'T23:59') : undefined
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
 * @param {Object} req.session
 * @param {express.Response} res
 */
const createHandler = async (req, res) => {
    const { publish, shifts, ...schedule } = req.body;

    const { hasAccess } = await checkAccess(req.session.user, publish ? 'publish' : 'create', 'schedule');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        schedule.author = req.session.user;

        if (publish) {
            // In case of re-publishing, we do not use overwrite flag from the schedule, as republishing itself is meant
            //  to overwrite the current schedule.
            console.log('Republishing current schedule:', schedule);
        } else {
            const { success, message, id } = await createSchedule(schedule);

            if (!success)
                return res.status(400).json({ message });

            if (shifts)
                await updateScheduleShifts(id, shifts);

            const newSchedule = await getSchedule({ id });

            res.status(201).json({ message, schedule: newSchedule });
        }

    } catch (err) {
        console.error('Error creating a Working Schedule:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific Working Schedule.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const updateHandler = async (req, res) => {
    const { id } = req.params;
    const { publish, overwrite, shifts, ...schedule } = req.body;

    const { hasAccess } = await checkAccess(req.session.user, publish ? 'publish' : 'update', 'schedule', id);

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});
    
    try {

        if (publish) {
            // In case of shift publishing, we use overwrite flag from the schedule,
            //  if we want to overwrite the shifts from currently published scopes of users and dates in prev schedule.
            console.log('Publishing schedule draft:', schedule, overwrite);
        } else {
            const { success, message } = await updateSchedule(parseInt(id), schedule);

            if (!success)
                return res.status(400).json({ message });

            if (shifts)
                await updateScheduleShifts(id, shifts);

            const updatedSchedule = await getSchedule({id});

            res.json({ message, schedule: updatedSchedule });
        }
        
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
const deleteHandler = async (req, res) =>
    deleteResource(req, res, 'Schedule', deleteSchedule, req.query.delete_shifts === 'true');

// Auxiliary functions
async function updateScheduleShifts(schedule, shifts) {

    if (!shifts)
        return;

    if (shifts.new?.length)
        await Promise.all(shifts.new.map(async shift => {
            delete shift.id;

            shift.schedule = schedule;

            await createShift(shift);
        }));

    if (shifts.updated?.length)
        await Promise.all(shifts.updated.map(async shift => {
            const shiftId = shift.id;

            delete shift.id;

            shift.schedule = schedule;

            await updateShift(shiftId, shift);
        }));

    if (shifts.deleted?.length)
        await deleteShift(shifts.deleted.map(shift => shift.id));
}

// Router definitions
export const router = express.Router();

router.get('/', fetchHandler);
router.get('/:id', fetchHandler);
router.post('/', createHandler);
router.put('/:id', checkResourceIdHandler, updateHandler);
router.delete('/', deleteHandler);
router.delete('/:id', deleteHandler);

export default router;
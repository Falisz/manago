// BACKEND/api/roles.js
import express from 'express';
import {
    getShift
} from "../controllers/workPlanner.js";

// API Handlers
/**
 * Fetch Shifts.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchShiftsHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const shifts = await getShift({
            id: id != null ? parseInt(id) : undefined,
            user: req.query.user != null ? parseInt(req.query.user) : undefined,
            job_post: req.query.job_post != null ? parseInt(req.query.job_post) : undefined,
            schedule: req.query.schedule != null ? parseInt(req.query.schedule) : undefined,
            start_time: req.query.start_date ? new Date(req.query.start_date) : undefined,
            end_time: req.query.end_date ? new Date(req.query.end_date+'T23:59') : undefined,
        });

        if (req.params.id && !shifts)
            return res.status(404).json({ message: 'Shift not found.' });

        res.json(shifts);

    } catch (err) {
        console.error(`Error fetching Shift${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
}

// Router definitions
export const router = express.Router();

router.get('/', fetchShiftsHandler);
router.get('/:id', fetchShiftsHandler);

export default router;
// BACKEND/api/requestStatuses.js
import express from 'express';
import {
    getRequestStatus,
} from '../controllers/workPlanner.js';
import checkAccess from '../utils/checkAccess.js';

// API Handlers
/**
 * Fetch a Shift or multiple Shifts.
 * @param {express.Request} req
 * @param {string | null} req.query.include_shifts
 * @param {number} req.user
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
    const { id } = req.params;
    const query = {};
    try {
        if (id) {
            const { hasAccess } = await checkAccess(req.user, 'read', 'request-status', id);

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});

            query.id = id;
        }

        const job_posts = await getRequestStatus(query);

        if (id && !job_posts)
            return res.status(404).json({ message: 'Request Status not found.' });

        res.json(job_posts);

    } catch (err) {
        console.error(`Error fetching Request Status${id ? ' (ID: ' + id + ')' : 'es'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Router definitions
export const router = express.Router();

router.get('/{:id}', fetchHandler);

export default router;
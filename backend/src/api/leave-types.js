// BACKEND/api/leave-types.js
import express from 'express';
import checkAccess from '../utils/checkAccess.js';
import {
    getLeaveType,
} from '../controllers/workPlanner.js';

// API Handlers
const fetchHandler = async (req, res) => {
    const { id } = req.params;
    const query = {};
    try {
        if (id) {
            const { hasAccess } = await checkAccess(req.session.user, 'read', 'request-status', id);

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});

            query.id = id;
        }

        const job_posts = await getLeaveType(query);

        if (id && !job_posts)
            return res.status(404).json({ message: 'Request Status not found.' });

        res.json(job_posts);

    } catch (err) {
        console.error(`Error fetching Leave Type${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Router definitions
export const router = express.Router();

router.get('/', fetchHandler);
router.get('/:id', fetchHandler);

export default router;
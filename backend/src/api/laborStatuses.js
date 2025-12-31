// BACKEND/api/laborStatuses.js
import express from 'express';
import { getLaborStatus } from '#controllers';
import checkAccess from '#utils/checkAccess.js';

// API Handlers
/**
 Fetch multiple Labor statuses or one status by its ID.
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
            const { hasAccess } = await checkAccess(req.user, 'read', 'labor-status', id);

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});

            query.id = id;
        }

        const job_posts = await getLaborStatus(query);

        if (id && !job_posts)
            return res.status(404).json({ message: 'Labor Status not found.' });

        res.json(job_posts);

    } catch (err) {
        console.error(`Error fetching Labor Status${id ? ' (ID: ' + id + ')' : 'es'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Router definitions
export const router = express.Router();

router.get('/{:id}', fetchHandler);

export default router;
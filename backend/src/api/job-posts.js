// BACKEND/api/job-posts.js
import express from 'express';
import checkAccess from '../utils/checkAccess.js';
import checkResourceIdHandler from '../utils/checkResourceId.js';
import deleteResource from '../utils/deleteResource.js';
import {
    getJobPost,
    createJobPost,
    updateJobPost,
    deleteJobPost
} from '../controllers/workPlanner.js';

// API Handlers
/**
 * Fetch a Shift or multiple Shifts.
 * @param {express.Request} req
 * @param {Object} req.query
 * @param {string | null} req.query.include_shifts
 * @param {Object} req.session
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
    const { id } = req.params;
    let query = {};

    try {
        if (id) {
            const { hasAccess } = await checkAccess(req.session.user, 'read', 'job-post', id);

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});

            query.id = id;
        } else {
            if (req.query.include_shifts)
                query.user = parseInt(req.query.include_shifts);
        }

        const job_posts = await getJobPost(query);

        if (id && !job_posts)
            return res.status(404).json({ message: 'Job Post not found.' });

        res.json(job_posts);

    } catch (err) {
        console.error(`Error fetching Job Post${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }

};

const createHandler = async (req, res) => {

};

const updateHandler = async (req, res) => {

};

const deleteHandler = async (req, res) =>
    deleteResource(req, res, 'Job Post', deleteJobPost);

// Router definitions
export const router = express.Router();

router.get('/', fetchHandler);
router.get('/:id', fetchHandler);
router.post('/', createHandler);
router.put('/', updateHandler);
router.put('/:id', checkResourceIdHandler, updateHandler);
router.delete('/', deleteHandler);
router.delete('/:id', deleteHandler);

export default router;
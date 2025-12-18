// BACKEND/api/jobPosts.js
import express from 'express';
import {
    getJobPost,
    createJobPost,
    updateJobPost,
    deleteJobPost
} from '#controllers';
import checkResourceIdHandler from '#middleware/checkResourceId.js';
import checkAccess from '#utils/checkAccess.js';
import deleteResource from '#utils/deleteResource.js';

// API Handlers
/**
 * Fetch multiple Job Posts or one by its ID.
 * @param {express.Request} req
 * @param {Object} req.query
 * @param {string | null} req.query.include_shifts
 * @param {number} req.user
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
    const { id } = req.params;

    try {
        if (id) {
            const { hasAccess } = await checkAccess(req.user, 'read', 'job-post', id);

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});

            const result = await getJobPost({ id: parseInt(id) });

            if (!result)
                return res.status(404).json({ message: 'Job Post not found.' });
        }

        const job_posts = await getJobPost();

        res.json(job_posts);

    } catch (err) {
        console.error(`Error fetching Job Post${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }

};

/**
 * Create a new Job Post.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const createHandler = async (req, res) => {

    const { hasAccess } = await checkAccess(req.user, 'create', 'job-post');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const data = req.body;

        const { success, message, id } = await createJobPost(data);

        if (!success)
            return res.status(400).json({ message });

        const jobPost = await getJobPost({id});

        res.status(201).json({ message, jobPost });

    } catch (err) {
        console.error('Error creating a Job Post:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }

};

/**
 * Update a specific Job Post by ID.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const updateHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const data = req.body;

        const { hasAccess } = await checkAccess(req.user, 'update', 'job-post', id);

        if (!hasAccess)
            return res.status(403).json({message: 'Not permitted.'});

        const { success, message } = await updateJobPost(parseInt(id), data);

        if (!success)
            return res.status(400).json({ message });

        const jobPost = await getJobPost({id});

        res.json({ message, jobPost });

    } catch (err) {
        console.error(`Error updating Holiday (ID: ${id}):`, err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }

};

/**
 * Delete a specific Job Post by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteHandler = async (req, res) =>
    deleteResource(req, res, 'Job Post', deleteJobPost);

// Router definitions
export const router = express.Router();

router.get('/{:id}', fetchHandler);
router.post('/', createHandler);
router.put('/:id', checkResourceIdHandler, updateHandler);
router.delete('/{:id}', deleteHandler);

export default router;
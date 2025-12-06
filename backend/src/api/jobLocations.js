// BACKEND/api/jobLocations.js
import express from 'express';
import {
    getJobLocation,
    createJobLocation,
    updateJobLocation,
    deleteJobLocation
} from '../controllers/workPlanner.js';
import checkAccess from '../utils/checkAccess.js';
import checkResourceIdHandler from '../utils/checkResourceId.js';
import deleteResource from '../utils/deleteResource.js';

// API Handlers

/**
 * Fetch multiple Job Locations or one by its ID.
 * @param {express.Request} req
 * @param {string|null} req.params.id - optional Job Location ID
 * @param {string} req.query.include_shifts - if "true", includes related shifts
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
    const { id } = req.params;
    const include_shifts = req.query.include_shifts === 'true';

    try {
        if (id) {
            const { hasAccess } = await checkAccess(req.session.user, 'read', 'job-location', id);

            if (!hasAccess)
                return res.status(403).json({ message: 'Not permitted.' });

            const location = await getJobLocation({ id: parseInt(id), include_shifts });

            if (!location)
                return res.status(404).json({ message: 'Job Location not found.' });

            return res.json(location);
        }

        // Fetch all
        const { hasAccess } = await checkAccess(req.session.user, 'read', 'job-location');
        if (!hasAccess)
            return res.status(403).json({ message: 'Not permitted.' });

        const locations = await getJobLocation({ include_shifts });
        res.json(locations);

    } catch (err) {
        console.error(`Error fetching Job Location${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new Job Location.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const createHandler = async (req, res) => {
    const { hasAccess } = await checkAccess(req.session.user, 'create', 'job-location');

    if (!hasAccess)
        return res.status(403).json({ message: 'Not permitted.' });

    try {
        const data = req.body;

        const { success, message, id } = await createJobLocation(data);

        if (!success)
            return res.status(400).json({ message });

        const location = await getJobLocation({ id });

        res.status(201).json({ message, jobLocation: location });

    } catch (err) {
        console.error('Error creating Job Location:', err, 'Provided data:', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific Job Location by ID.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const updateHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const data = req.body;

        const { hasAccess } = await checkAccess(req.session.user, 'update', 'job-location', id);

        if (!hasAccess)
            return res.status(403).json({ message: 'Not permitted.' });

        const { success, message } = await updateJobLocation(parseInt(id), data);

        if (!success)
            return res.status(400).json({ message });

        const location = await getJobLocation({ id: parseInt(id) });

        res.json({ message, jobLocation: location });

    } catch (err) {
        console.error(`Error updating Job Location (ID: ${id}):`, err, 'Provided data:', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Delete a specific Job Location by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteHandler = async (req, res) =>
    deleteResource(req, res, 'Job Location', deleteJobLocation);

// Router
export const router = express.Router();

router.get('/{:id}', fetchHandler);
router.post('/', createHandler);
router.put('/:id', checkResourceIdHandler, updateHandler);
router.delete('/{:id}', deleteHandler);

export default router;
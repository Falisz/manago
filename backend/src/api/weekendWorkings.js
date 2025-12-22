// BACKEND/api/weekendWorkings.js
import express from 'express';
import {
    getUser,
    getWeekendWorking,
    createWeekendWorking,
    updateWeekendWorking,
    deleteWeekendWorking,
} from '#controllers';
import checkResourceIdHandler from '#middleware/checkResourceId.js';
import checkAccess from '#utils/checkAccess.js';
import deleteResource from '#utils/deleteResource.js';

// API Handlers
/**
 * Fetch multiple Weekend Working Agreements or one by its ID.
 * @param {express.Request} req
 * @param {object} req.query
 * @param {number} req.query.user
 * @param {number} req.query.managed
 * @param {string} req.query.date
 * @param {number} req.user
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
    const { id } = req.params;

    try {
        if (id) {
            const { hasAccess } = await checkAccess(req.user, 'read', 'weekend-working', id);

            if (!hasAccess)
                return res.status(403).json({ message: 'Not permitted.' });

            const result = await getWeekendWorking({ id: parseInt(id) });

            if (!result)
                return res.status(404).json({ message: 'Weekend Working Agreement not found.' });

            return res.json(result);
        }

        const { hasAccess } = await checkAccess(req.user, 'read', 'weekend-working');

        if (!hasAccess)
            return res.status(403).json({ message: 'Not permitted.' });

        const query = {};

        if (req.query.user)
            query.user = parseInt(req.query.user);

        if (req.query.managed)
            query.user = (await getUser({scope: 'manager', scope_id: parseInt(req.query.managed)})).map(u => u.id);

        if (req.query.date)
            query.date = req.query.date;

        const results = await getWeekendWorking(query);

        res.json(results);

    } catch (err) {
        console.error(`Error fetching Weekend Working${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * POST /api/weekend-workings
 */
const createHandler = async (req, res) => {

    try {
        const data = req.body;
        if (!data)
            return res.status(400).json({ message: 'No data provided.' });

        const { hasAccess } = await checkAccess(req.user, data.status === 1 ? 'request' : 'create', 'weekend-working');
        if (!hasAccess)
            return res.status(403).json({ message: 'Not permitted.' });

        data.user = req.user;

        const { success, message, id } = await createWeekendWorking(data);
        if (!success)
            return res.status(400).json({ message });

        const weekendWorking = await getWeekendWorking({ id });

        res.status(201).json({ message, weekendWorking });
    } catch (err) {
        console.error('Error creating Weekend Working Agreement:', err, 'Data:', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * PUT /api/weekend-workings/:id
 */
const updateHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const data = req.body;

        const { hasAccess } = await checkAccess(req.user, 'update', 'weekend-working', id);
        if (!hasAccess)
            return res.status(403).json({ message: 'Not permitted.' });

        const { success, message } = await updateWeekendWorking(parseInt(id), data);
        if (!success)
            return res.status(400).json({ message });

        const weekendWorking = await getWeekendWorking({ id: parseInt(id) });

        res.json({ message, weekendWorking });
    } catch (err) {
        console.error(`Error updating Weekend Working Agreement (ID: ${id}):`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * DELETE /api/weekend-workings/:id  (or batch via query ?id=1,2,3)
 */
const deleteHandler = async (req, res) =>
    deleteResource(req, res, 'Weekend Working Agreement', deleteWeekendWorking);

// Router
export const router = express.Router();

router.get('/{:id}', fetchHandler);
router.post('/', createHandler);
router.put('/:id', checkResourceIdHandler, updateHandler);
router.delete('/{:id}', deleteHandler);

export default router;
// BACKEND/api/labor.js
import express from 'express';
import {
    getLabor,
    createLabor,
    updateLabor,
    deleteLabor,
    getUser
} from '#controllers';
import checkResourceIdHandler from '#middleware/checkResourceId.js';
import checkAccess from '#utils/checkAccess.js';
import deleteResource from '#utils/deleteResource.js';

// API Handlers
/**
 * Fetch a Labor record or multiple Labor records.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const fetchLaborHandler = async (req, res) => {
    const { id } = req.params;
    let query = {};
    let users = [];

    try {
        if (id) {
            const { hasAccess } = await checkAccess(req.user, 'read', 'labor', id);

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});

            query.id = parseInt(id);

        } else {
            if (req.query.user) {
                query.user = parseInt(req.query.user);
            } else if (req.query.user_scope) {
                const scope = req.query.user_scope;
                const scope_id = scope === 'you' ? req.user : req.query.user_scope_id;

                users = await getUser({scope, scope_id});

                if (!Array.isArray(users))
                    users = [users];

                query.user = users.map(user => user?.id);
            }

            if (req.query.date) {
                query.date = req.query.date;
            } else {
                if (req.query.start_date)
                    query.from = req.query.start_date;
                if (req.query.end_date)
                    query.to = req.query.end_date;
            }

            if (req.query.project === 'null')
                query.project = null;
            else if (req.query.project)
                query.project = parseInt(req.query.project);

            if (req.query.type)
                query.type = req.query.type;

            if (req.query.status)
                query.status = parseInt(req.query.status);

            if (req.query.approver === 'null')
                query.approver = null;
            else if (req.query.approver)
                query.approver = parseInt(req.query.approver);
        }

        const labors = await getLabor(query);

        if (id && !labors)
            return res.status(404).json({ message: 'Labor record not found.' });

        if (id && Array.isArray(labors))
            return res.json(labors[0]);

        res.json(labors);

    } catch (err) {
        console.error(`Error fetching Labor record${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new Labor record or multiple Labor records.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const createLaborHandler = async (req, res) => {

    const { hasAccess } = await checkAccess(req.user, 'create', 'labor');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const data = req.body;

        if (Array.isArray(data)) {
            const newLabors = [];
            const errorMessages = [];

            for (const laborData of data) {
                if (laborData.user == null) laborData.user = req.user;
                if (laborData.status == null) laborData.status = 0;

                const { success, message, id } = await createLabor(laborData);

                if (success)
                    newLabors.push(await getLabor({id}));
                else
                    errorMessages.push(message);
            }

            res.status(201).json({ message: `Created ${newLabors.length} new labor records.`, newLabors, errorMessages})

        } else {
            if (data.user == null) data.user = req.user;
            if (data.status == null) data.status = 0;

            const { success, message, id } = await createLabor(data);

            if (!success)
                return res.status(400).json({ message });

            const labor = await getLabor({id});

            res.status(201).json({ message, labor });
        }

    } catch (err) {
        console.error('Error creating a Labor record:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific Labor record or multiple Labor records.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const updateLaborHandler = async (req, res) => {
    const { id } = req.params;

    try {
        if (id) {
            const { hasAccess } = await checkAccess(req.user, 'update', 'labor', id);

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});

            const data = req.body;

            const { success, message } = await updateLabor(parseInt(id), data);

            if (!success)
                return res.status(400).json({ message });

            const labor = await getLabor({id});

            res.json({ message, labor });
        } else {
            let { ids, data } = req.body;

            const {
                hasAccess,
                hasFullAccess,
                allowedIds,
                forbiddenIds
            } = await checkAccess(req.user, 'update', 'labor', ids);

            if (!hasAccess)
                return res.status(403).json({message: 'Not permitted.'});

            const warning = [];

            if (!hasFullAccess) {
                ids = Array.from(allowedIds);

                warning.push(`You are not permitted to update
                 ${'Labor record' + (forbiddenIds.size > 1 ? 's with IDs:' : ' with ID:')} ${forbiddenIds.join(', ')}.`);
            }

            const updated = [];

            for (const id of ids) {
                const { success, message } = await updateLabor(parseInt(id), data);

                if (success)
                    updated.push(await getLabor({ id }));
                else
                    warning.push(message);
            }

            res.status(201).json({ message: `Updated ${updated.length} labor records.`, updated, warning})

        }
    } catch (err) {
        console.error(`Error updating a Labor record (ID: ${id}):`, err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Delete a specific Labor record by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteLaborHandler = async (req, res) =>
    deleteResource(req, res, 'Labor', deleteLabor);

// Router definitions
export const router = express.Router();

router.get('/{:id}', fetchLaborHandler);
router.post('/', createLaborHandler);
router.put('/', updateLaborHandler);
router.put('/:id', checkResourceIdHandler, updateLaborHandler);
router.delete('/{:id}', deleteLaborHandler);

export default router;
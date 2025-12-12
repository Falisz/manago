// BACKEND/api/contracts.js
import express from 'express';
import {
    getContract,
    createContract,
    updateContract,
    deleteContract,
    getUser,
} from '../controllers/users.js';
import checkAccess from '../utils/checkAccess.js';
import checkResourceIdHandler from './checkResourceId.js';
import deleteResource from '../utils/deleteResource.js';

// API Handlers
/**
 * Fetch multiple Contracts or one by its ID.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
    const { id } = req.params;

    const { hasAccess } = await checkAccess(req.user, 'read', 'contract', id);

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const query = {};

        if (id != null)
            query.id = id;
        else {
            if (req.query.user != null)
                query.user = req.query.user;
            if (req.query.managed != null)
                query.user = await getUser({scope: 'manager', scope_id: parseInt(req.query.managed)});
            if (req.query.type != null)
                query.type = req.query.type;
        }

        const result = await getContract(query);

        if (id != null && !result)
            return res.status(404).json({ message: 'Contract not found.' });

        res.json(result);

    } catch (err) {
        console.error(`Error fetching Contract${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new Contract.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const createHandler = async (req, res) => {

    const { hasAccess } = await checkAccess(req.user, 'create', 'contract');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const { success, message, id } = await createContract(req.body);

        if (!success)
            return res.status(400).json({ message });

        const role = await getRole({id});

        res.status(201).json({ message, role });

    } catch (err) {
        console.error('Error creating a Contract:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a Contract.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const updateHandler = async (req, res) => {
    const { id } = req.params;

    const { hasAccess } = await checkAccess(req.user, 'update', 'contract', id);

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});
    
    try {
        const { success, message } = await updateContract(parseInt(id), req.body);

        if (!success)
            return res.status(400).json({ message });

        const role = await getRole({id});

        res.json({ message, role });

    } catch (err) {
        console.error(`Error updating Contract (ID: ${id}):`, err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Delete a specific Contract by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteHandler = async (req, res) => deleteResource(req, res, 'Contract', deleteContract);

// Router definitions
export const router = express.Router();

router.get('/{:id}', fetchHandler);
router.post('/', createHandler);
router.put('/:id', checkResourceIdHandler, updateHandler);
router.delete('/{:id}', deleteHandler);

export default router;
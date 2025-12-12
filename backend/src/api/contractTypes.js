// BACKEND/api/contractTypes.js
import express from 'express';
import {
    getContractType,
    createContractType,
    updateContractType,
    deleteContractType,
    getRole
} from '#controllers';
import checkResourceIdHandler from '#middleware/checkResourceId.js';
import checkAccess from '#utils/checkAccess.js';
import deleteResource from '#utils/deleteResource.js';

// API Handlers
/**
 * Fetch multiple Contract Types or one by its ID.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
    const { id } = req.params;

    const { hasAccess } = await checkAccess(req.user, 'read', 'contract-type', id);

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const query = {};

        if (id != null)
            query.id = id;

        const result = await getContractType(query);

        if (id != null && !result)
            return res.status(404).json({ message: 'Contract Type not found.' });

        res.json(result);

    } catch (err) {
        console.error(`Error fetching Contract Type${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new Contract Type.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const createHandler = async (req, res) => {

    const { hasAccess } = await checkAccess(req.user, 'create', 'contract-type');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const { success, message, id } = await createContractType(req.body);

        if (!success)
            return res.status(400).json({ message });

        const role = await getRole({id});

        res.status(201).json({ message, role });

    } catch (err) {
        console.error('Error creating a Contract Type:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a Contract Type.
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
        const { success, message } = await updateContractType(parseInt(id), req.body);

        if (!success)
            return res.status(400).json({ message });

        const role = await getRole({id});

        res.json({ message, role });

    } catch (err) {
        console.error(`Error updating Contract Type (ID: ${id}):`, err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Delete a specific Contract Type by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteHandler = async (req, res) => deleteResource(req, res, 'Contract', deleteContractType);

// Router definitions
export const router = express.Router();

router.get('/{:id}', fetchHandler);
router.post('/', createHandler);
router.put('/:id', checkResourceIdHandler, updateHandler);
router.delete('/{:id}', deleteHandler);

export default router;
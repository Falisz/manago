// BACKEND/api/leaves.js
import express from 'express';
import {
    getLeave
} from "../controllers/workPlanner.js";

// API Handlers
/**
 * Fetch Leaves.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchLeavesHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const leaves = await getLeave({
            id: id != null ? parseInt(id) : undefined,
            user: req.body.user ? req.body.user :
                req.query.user != null ? parseInt(req.query.user) : undefined,
            approver: req.body.approver ? req.body.approver :
                req.query.approver != null ? parseInt(req.query.approver) : undefined,
            date: req.body.date ? new Date(req.body.date) :
                req.query.date ? new Date(req.query.date) : undefined,
            start_date: req.body.start_date ? new Date(req.body.start_date) :
                req.query.start_date ? new Date(req.query.start_date) : undefined,
            end_date: req.body.end_date ? new Date(req.body.end_date) :
                req.query.end_date ? new Date(req.query.end_date) : undefined,
        });

        if (id && !leaves)
            return res.status(404).json({ message: 'Leave not found.' });

        res.json(leaves);

    } catch (err) {
        console.error(`Error fetching Leave${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
}

// Router definitions
export const router = express.Router();

router.get('/', fetchLeavesHandler);
router.get('/:id', fetchLeavesHandler);
router.post('/bulk', fetchLeavesHandler);

export default router;
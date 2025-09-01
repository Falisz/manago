//BACKEND/api/teams.js
import express from 'express';
import { getTeams } from '../controllers/teams.js';
export const router = express.Router();

router.get('/', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const teams = await getTeams();

        res.json(teams);

    } catch (err) {
        console.error('Error fetching teams:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;
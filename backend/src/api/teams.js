// BACKEND/api/teams.js
import express from 'express';
import {
    getTeams,
    getTeam,
    getAllTeams,
    createTeam,
    updateTeamMembers,
    updateTeam,
    deleteTeam
} from '../controllers/teams.js';
export const router = express.Router();

router.get('/', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const teams = req.query.all === 'true' ? await getAllTeams() : await getTeams();

        res.json(teams);

    } catch (err) {
        console.error('Error fetching teams:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.get('/:teamId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }
        const { teamId } = req.params;

        if (!teamId || isNaN(teamId)) {
            return res.status(400).json({ message: 'Invalid team ID.' });
        }

        const team = await getTeam(parseInt(teamId));

        if (!team) {
            return res.status(404).json({ message: 'Team not found.' });
        }

        res.json(team);

    } catch (err) {
        console.error('Error fetching team:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.post('/', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const {code_name, name, parent_team, leader_ids, manager_ids} = req.body;

        const result = await createTeam({code_name, name, parent_team});

        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }

        /** @type {Team} **/
        const team = await getTeam(parseInt(result.team.id));

        if (manager_ids && manager_ids.length > 0) {
            const teamManagers = manager_ids
                .filter(id => id !== null);
            await updateTeamMembers(team.id, teamManagers, 2);
        }

        if (leader_ids && leader_ids.length > 0) {
            const teamLeaders = leader_ids
                .filter(id => id !== null);
            await updateTeamMembers(team.id, teamLeaders, 1);
        }

        res.status(201).json({ message: result.message, team });

        res.status(400).json();

    } catch (err) {
        console.error('Error creating a team:', err);
        res.status(500).json({ message: 'Server error.' });
    }
})

router.post('/assignments', async(req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        console.log('Feature to be implemented. Sent data:',req.body);

    } catch (err) {
        console.error('Error editing user assignments:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.put('/:teamId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }
        const { teamId } = req.params;

        if (!teamId || isNaN(teamId)) {
            return res.status(400).json({ message: 'Invalid team ID.' });
        }

        const {code_name, name, parent_team, leader_ids, manager_ids} = req.body;

        const result = await updateTeam(parseInt(teamId), {
            code_name,
            name,
            parent_team
        });

        if (!result.success) {
            return res.status( 400).json({ message: result.message });
        }

        if (manager_ids && manager_ids.length > 0) {
            const teamManagers = manager_ids
                .filter(id => id !== null);
            await updateTeamMembers(teamId, teamManagers, 2, 'overwrite');
        }

        if (leader_ids && leader_ids.length > 0) {
            const teamLeaders = leader_ids
                .filter(id => id !== null);
            await updateTeamMembers(teamId, teamLeaders, 1, 'overwrite');
        }

        const team = await getTeam(parseInt(result.team.id));

        res.json({ message: result.message, team });

    } catch (err) {

    }
})

router.delete('/:teamId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }
        const { teamId } = req.params;

        if (!teamId || isNaN(teamId)) {
            return res.status(400).json({ message: 'Invalid team ID.' });
        }

        const result = await deleteTeam(parseInt(teamId), req.query.cascade === 'true');

        if (!result.success) {
            return res.status( 400).json({ message: result.message });
        }

        res.json({ message: 'Team deleted successfully!' });
    } catch (err) {
        console.error('Error deleting team:', err);
        res.status(500).json({ message: 'Server error.' });
    }
})

export default router;
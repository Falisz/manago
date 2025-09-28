// BACKEND/api/teams.js
import express from 'express';
import checkAuthHandler from '../utils/check-auth.js';
import {
    getTeams,
    getTeam,
    getAllTeams,
    createTeam,
    updateTeamUsers,
    updateTeam,
    deleteTeam
} from '../controllers/teams.js';

// API Handlers
/**
 * Fetch all teams.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchTeamsHandler = async (req, res) => {
    try {
        const teams = req.query.all === 'true' ? await getAllTeams() : await getTeams();

        res.json(teams);
    } catch (err) {
        console.error('Error fetching teams:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Fetch a specific team by ID in URL.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchTeamHandler = async (req, res) => {
    try {
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
};

/**
 * Create a new team.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const createTeamHandler = async (req, res) => {
    try {
        const { code_name, name, parent_team, leader_ids, manager_ids } = req.body;

        const result = await createTeam({ code_name, name, parent_team });

        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }

        if (manager_ids && manager_ids.length > 0) {
            const teamManagers = manager_ids.filter(id => id !== null);
            await updateTeamUsers([result.team.id], teamManagers, 3);
        }

        if (leader_ids && leader_ids.length > 0) {
            const teamLeaders = leader_ids.filter(id => id !== null);
            await updateTeamUsers([result.team.id], teamLeaders, 2);
        }

        res.status(201).json({ message: result.message, team: result.team });
    } catch (err) {
        console.error('Error creating a team:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update team assignments (managers or leaders).
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateTeamAssignmentsHandler = async(req, res) => {
    try {
        const {resource, resourceIds, teamIds, role, mode} = req.body;
        let result;

        if (resource === 'user') {
            result = await updateTeamUsers(teamIds, resourceIds, role, mode);
        } else {
            return res.status(400).json({message: 'Unknown resource.'});
        }

        if (!result.success) {
            return res.status(result.status || 400).json({message: result.message});
        }

        res.json({message: result.message});

    } catch (err) {
        console.error('Error editing user assignments:', err);
        res.status(500).json({message: 'Server error.'});
    }
};

/**
 * Update a specific team by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateTeamHandler = async (req, res) => {
    try {
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
            await updateTeamUsers(teamId, teamManagers, 2, 'set');
        }

        if (leader_ids && leader_ids.length > 0) {
            const teamLeaders = leader_ids
                .filter(id => id !== null);
            await updateTeamUsers(teamId, teamLeaders, 1, 'set');
        }

        const team = await getTeam(parseInt(result.team.id));

        res.json({ message: result.message, team });

    } catch (err) {

    }
};

/**
 * Delete a specific team by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteTeamHandler = async (req, res) => {
    try {
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
};

/**
 * Bulk delete teams by IDs.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const bulkDeleteTeamsHandler = async (req, res) => {
    try {
        const { teamIds } = req.body;

        console.log('Request for bulk-delete of Teams: ', teamIds);

        res.status(400).json({ message: 'Bulk-delete not implemented yet!' });

    } catch (err) {
        console.error('Error removing user:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Router definitions
export const router = express.Router();

router.get('/', checkAuthHandler, fetchTeamsHandler);
router.get('/:teamId', checkAuthHandler, fetchTeamHandler);
router.post('/', checkAuthHandler, createTeamHandler);
router.post('/assignments', checkAuthHandler, updateTeamAssignmentsHandler);
router.put('/:teamId', checkAuthHandler, updateTeamHandler);
router.delete('/:teamId', checkAuthHandler, deleteTeamHandler);
router.delete('/', checkAuthHandler, bulkDeleteTeamsHandler);

export default router;
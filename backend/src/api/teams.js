// BACKEND/api/teams.js
import express from 'express';
import checkAuthHandler from '../utils/checkAuth.js';
import checkResourceIdHandler from '../utils/checkResourceId.js';
import {
    getTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    updateTeamUsers
} from '../controllers/teams.js';

// API Handlers
/**
 * Fetch all Teams or a Team by its ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchTeamsHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const teams = await getTeam({
            id,
            all: req.query.all === 'true'
        });
        
        if (req.params.teamId && !teams)
            return res.status(404).json({ message: 'Team not found.' });

        res.json(teams);
    } catch (err) {
        console.error(`Error fetching Team${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new Team.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const createTeamHandler = async (req, res) => {
    try {
        const { code_name, name, parent_team, leader_ids, manager_ids } = req.body;

        const result = await createTeam({ code_name, name, parent_team });

        if (!result.success)
            return res.status(400).json({ message: result.message });

        if (manager_ids && manager_ids.length > 0) {
            const teamManagers = manager_ids.filter(id => id !== null);
            await updateTeamUsers([result.team], teamManagers, 3);
        }

        if (leader_ids && leader_ids.length > 0) {
            const teamLeaders = leader_ids.filter(id => id !== null);
            await updateTeamUsers([result.team], teamLeaders, 2);
        }

        res.status(201).json({ message: result.message, team: result.team });
    } catch (err) {
        console.error('Error creating a Team:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific Team by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateTeamHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const {code_name, name, parent_team, leader_ids, manager_ids} = req.body;

        const result = await updateTeam(parseInt(id), {
            code_name,
            name,
            parent_team
        });

        if (!result.success) 
            return res.status(400).json({ message: result.message });

        if (manager_ids && manager_ids.length > 0)
            await updateTeamUsers(id, manager_ids.filter(id => id !== null), 2, 'set');

        if (leader_ids && leader_ids.length > 0)
            await updateTeamUsers(id, leader_ids.filter(id => id !== null), 1, 'set');

        res.json({ message: result.message, team: result.team });

    } catch (err) {
        console.error(`Error updating Team (ID: ${id}):`, err, 'Provided data: ', req.body);
        res.status(500).json({message: 'Server error.'});

    }
};

/**
 * Update Team assignments (Managers or Leaders).
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateTeamAssignmentsHandler = async(req, res) => {
    try {
        const {resource, resourceIds, teamIds, role, mode} = req.body;
    
        if (!teamIds || !teamIds.length)
            return res.status(400).json({ message: 'Team IDs are missing.' });

        let result;

        if (resource === 'user')
            result = await updateTeamUsers(teamIds, resourceIds, role, mode);
        else
            return res.status(400).json({message: 'Unknown resource.'});

        if (!result.success)
            return res.status(result.status || 400).json({message: result.message});

        res.json({message: result.message});

    } catch (err) {
        console.error('Error updating Team assignments:', err, 'Provided data: ', req.body);
        res.status(500).json({message: 'Server error.'});
    }
};

/**
 * Delete a specific team by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteTeamHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await deleteTeam(parseInt(id), req.query.cascade === 'true');

        if (!result.success)
            return res.status( 400).json({ message: result.message });

        res.json({ message: 'Team deleted successfully!' });
    } catch (err) {
        console.error(`Error deleting Team (ID: ${id}):`, err);
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
        console.error(`Error removing Teams (${req.body.teamIds}):`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Router definitions
export const router = express.Router();

router.get('/', checkAuthHandler, fetchTeamsHandler);
router.get('/:id', checkAuthHandler, fetchTeamsHandler);
router.post('/', checkAuthHandler, createTeamHandler);
router.post('/assignments', checkAuthHandler, updateTeamAssignmentsHandler);
router.put('/:id', checkAuthHandler, checkResourceIdHandler, updateTeamHandler);
router.delete('/:id', checkAuthHandler, checkResourceIdHandler, deleteTeamHandler);
router.delete('/', checkAuthHandler, bulkDeleteTeamsHandler);

export default router;
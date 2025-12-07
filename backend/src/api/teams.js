// BACKEND/api/teams.js
import express from 'express';
import {
    getTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    updateTeamUsers,
    getTeamUsers
} from '../controllers/teams.js';
import checkAccess from '../utils/checkAccess.js';
import checkResourceIdHandler from './checkResourceId.js';
import deleteResource from '../utils/deleteResource.js';

// API Handlers
/**
 * Fetch all Teams or a Team by its ID.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
    const { id } = req.params;

    const { hasAccess } = await checkAccess(req.user, 'read', 'team', id);

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const teams = await getTeam({
            id,
            all: req.query.all === 'true'
        });
        
        if (req.params.id && !teams)
            return res.status(404).json({ message: 'Team not found.' });

        res.json(teams);
    } catch (err) {
        console.error(`Error fetching Team${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Fetch Users for a specific team.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const fetchUsersHandler = async (req, res) => {
    const { id } = req.params;

    const { hasAccess } = await checkAccess(req.user, 'read', 'team', id);

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const users = await getTeamUsers({
            team: parseInt(id),
            role: req.query.role != null ? parseInt(req.query.role) : undefined,
            include_subteams: req.query.include_subteams === 'true',
            include_parent_teams: req.query.include_parent_teams === 'true'
        });


        res.json(users);

    } catch (err) {
        console.error('Error fetching Team Users:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new Team.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const createHandler = async (req, res) => {

    const { hasAccess } = await checkAccess(req.user, 'create', 'team');

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const { success, message, id} = await createTeam(req.body);

        if (!success)
            return res.status(400).json({ message });

        const team = await getTeam({id});

        const { members, leaders, managers } = req.body;

        if (managers && managers.length > 0)
            await updateTeamUsers([id], managers.filter(id => id !== null), 3, 'set');

        if (leaders && leaders.length > 0)
            await updateTeamUsers([id], leaders.filter(id => id !== null), 2, 'set');
``
        if (members && members.length > 0)
            await updateTeamUsers([id], members.filter(id => id !== null), 1, 'set');

        res.status(201).json({ message, team });

    } catch (err) {
        console.error('Error creating a Team:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific Team by ID.
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const updateHandler = async (req, res) => {
    const { id } = req.params;

    const { hasAccess } = await checkAccess(req.user, 'update', 'team', id);

    if (!hasAccess)
        return res.status(403).json({message: 'Not permitted.'});

    try {
        const {code_name, name, parent_team, members, leaders, managers} = req.body;

        const { success, message } = await updateTeam(parseInt(id), {
            code_name,
            name,
            parent_team
        });

        if (!success)
            return res.status(400).json({ message });

        const team = getTeam({id});

        if (managers != null)
            await updateTeamUsers([id], managers.filter(id => id !== null), 3, 'set');

        if (leaders != null)
            await updateTeamUsers([id], leaders.filter(id => id !== null), 2, 'set');

        if (members != null)
            await updateTeamUsers([id], members.filter(id => id !== null), 1, 'set');

        res.json({ success, team });

    } catch (err) {
        console.error(`Error updating Team (ID: ${id}):`, err, 'Provided data: ', req.body);
        res.status(500).json({message: 'Server error.'});

    }
};

/**
 * Update Team assignments (Managers or Leaders).
 * @param {express.Request} req
 * @param {number} req.user
 * @param {express.Response} res
 */
const updateAssignmentsHandler = async(req, res) => {

    try {
        const {resource, resourceIds, teamIds, mode} = req.body;
    
        if (!teamIds || !teamIds.length)
            return res.status(400).json({ message: 'Team IDs are missing.' });

        const { hasAccess } = await checkAccess(req.user, 'assign', 'team', teamIds, resource, resourceIds);

        if (!hasAccess)
            return res.status(403).json({message: 'Not permitted.'});

        let success, message;

        if (['user', 'member', 'leader', 'manager'].includes(resource)) {
            const role = resource === 'manager' ? 3 :
                            resource === 'leader' ? 2 : 1;
            ({success, message} = await updateTeamUsers(teamIds, resourceIds, role, mode));
        }
        else
            return res.status(400).json({message: 'Unknown Resource type provided.'});

        if (!success)
            return res.status(400).json({message});

        res.json({message});

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
const deleteHandler = async (req, res) => deleteResource(req, res, 'Team', deleteTeam, req.query.cascade === 'true');
    
// Router definitions
export const router = express.Router();

router.get('/{:id}', fetchHandler);
router.get('/:id/users', checkResourceIdHandler, fetchUsersHandler);
router.post('/', createHandler);
router.post('/assignments', updateAssignmentsHandler);
router.put('/:id', checkResourceIdHandler, updateHandler);
router.delete('/{:id}', deleteHandler);

export default router;
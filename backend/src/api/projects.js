// BACKEND/api/projects.js
import express from 'express';
import checkResourceIdHandler from '../utils/checkResourceId.js';
import {
    getProject,
    createProject,
    updateProject,
    deleteProject,
    updateProjectUsers,
    getProjectUsers
} from '../controllers/projects.js';

// API Handlers
/**
 * Fetch all Projects or a Project by its ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchProjectsHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const projects = await getProject({
            id,
            get_members: req.query.get_members !== 'false'
        });

        if (req.params.id && !projects)
            return res.status(404).json({ message: 'Project not found.' });

        res.json(projects);
    } catch (err) {
        console.error(`Error fetching Project${id ? ' (ID: ' + id + ')' : 's'}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Fetch Users for a specific project.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchProjectUsersHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const users = await getProjectUsers(
            parseInt(id),
            req.query.include_details !== 'false'
        );

        res.json(users);
    } catch (err) {
        console.error('Error fetching Project Users:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new Project.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const createProjectHandler = async (req, res) => {
    try {
        const { success, message, id } = await createProject(req.body);

        if (!success)
            return res.status(400).json({ message });

        const project = await getProject({ id });

        const { member_ids } = req.body;

        if (member_ids && member_ids.length > 0) {
            const projectMembers = member_ids.filter(id => id !== null);
            await updateProjectUsers([id], projectMembers, 'add');
        }

        res.status(201).json({ message, project });
    } catch (err) {
        console.error('Error creating a Project:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update a specific Project by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateProjectHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const { name, manager, description, startDate, endDate, data, members } = req.body;

        const { success, message } = await updateProject(parseInt(id), {
            name,
            manager,
            description,
            startDate,
            endDate,
            data
        });

        if (!success)
            return res.status(400).json({ message });

        const project = await getProject({ id });

        if (members != null)
            await updateProjectUsers([id], members.filter(id => id !== null), 'set');

        res.json({ success, project });
    } catch (err) {
        console.error(`Error updating Project (ID: ${id}):`, err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update Project assignments (Members).
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateAssignmentsHandler = async (req, res) => {
    try {
        const { resource, resourceIds, projectIds, mode } = req.body;

        if (!projectIds || !projectIds.length)
            return res.status(400).json({ message: 'Project IDs are missing.' });

        let success, message;

        if (resource === 'user')
            ({ success, message } = await updateProjectUsers(projectIds, resourceIds, mode));
        else
            return res.status(400).json({ message: 'Unknown Resource type provided.' });

        if (!success)
            return res.status(400).json({ message });

        res.json({ message });
    } catch (err) {
        console.error('Error updating Project assignments:', err, 'Provided data: ', req.body);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Delete a specific Project by ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const deleteProjectHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const { success, message, deletedCount } = await deleteProject(parseInt(id));

        if (!success)
            return res.status(400).json({ message });

        res.json({ message, deletedCount });
    } catch (err) {
        console.error(`Error deleting Project (ID: ${id}):`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Bulk delete projects by IDs.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const bulkDeleteProjectsHandler = async (req, res) => {
    try {
        const { projectIds } = req.body;

        if (!projectIds || !projectIds.length)
            return res.status(400).json({ message: 'Project IDs are missing.' });

        const { success, message, deletedCount } = await deleteProject(projectIds);

        if (!success)
            return res.status(400).json({ message });

        res.json({ message, deletedCount });
    } catch (err) {
        console.error(`Error removing Projects (${req.body['projectIds']}):`, err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Router definitions
export const router = express.Router();

router.get('/', fetchProjectsHandler);
router.get('/:id', fetchProjectsHandler);
router.get('/:id/users', checkResourceIdHandler, fetchProjectUsersHandler);
router.post('/', createProjectHandler);
router.post('/assignments', updateAssignmentsHandler);
router.put('/:id', checkResourceIdHandler, updateProjectHandler);
router.delete('/:id', checkResourceIdHandler, deleteProjectHandler);
router.delete('/', bulkDeleteProjectsHandler);

export default router;
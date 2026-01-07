// BACKEND/api/projects.js
import express from 'express';
import {
    getProject,
    createProject,
    updateProject,
    deleteProject,
    updateProjectUsers,
    getProjectUsers
} from '#controllers';
import checkResourceIdHandler from '#middleware/checkResourceId.js';
import deleteResource from '#utils/deleteResource.js';

// API Handlers
/**
 * Fetch all Projects or a Project by its ID.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const projects = await getProject({
            id,
            user: req.query.user != null ? parseInt(req.query.user) : null,
            get_members: req.query.get_members !== 'false'
        });

        if (id && !projects)
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
const fetchUsersHandler = async (req, res) => {
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
const createHandler = async (req, res) => {
    try {
        const { success, message, id } = await createProject(req.body);

        if (!success)
            return res.status(400).json({ message });

        const project = await getProject({ id });

        const { owners, managers, developers, designers, testers, stakeholders } = req.body;

        if (owners != null) await updateProjectUsers([id], owners.filter(id => id !== null), 1);
        if (managers != null) await updateProjectUsers([id], managers.filter(id => id !== null), 2);
        if (developers != null) await updateProjectUsers([id], developers.filter(id => id !== null), 3);
        if (designers != null) await updateProjectUsers([id], designers.filter(id => id !== null), 4);
        if (testers != null) await updateProjectUsers([id], testers.filter(id => id !== null), 5);
        if (stakeholders != null) await updateProjectUsers([id], stakeholders.filter(id => id !== null), 6);

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
const updateHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const { name, description, startDate, endDate, data,
            owners, managers, developers, designers, testers, stakeholders } = req.body;

        const { success, message } = await updateProject(parseInt(id), {
            name,
            description,
            startDate,
            endDate,
            data
        });

        if (!success)
            return res.status(400).json({ message });

        const project = await getProject({ id });

        if (owners != null) await updateProjectUsers([id], owners.filter(id => id !== null), 1, 'set');
        if (managers != null) await updateProjectUsers([id], managers.filter(id => id !== null), 2, 'set');
        if (developers != null) await updateProjectUsers([id], developers.filter(id => id !== null), 3, 'set');
        if (designers != null) await updateProjectUsers([id], designers.filter(id => id !== null), 4, 'set');
        if (testers != null) await updateProjectUsers([id], testers.filter(id => id !== null), 5, 'set');
        if (stakeholders != null) await updateProjectUsers([id], stakeholders.filter(id => id !== null), 6, 'set');

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
const deleteHandler = async (req, res) => deleteResource(req, res, 'Project', deleteProject);

// Router definitions
export const router = express.Router();

router.get('/{:id}', fetchHandler);
router.get('/:id/users', checkResourceIdHandler, fetchUsersHandler);
router.post('/', createHandler);
router.post('/assignments', updateAssignmentsHandler);
router.put('/:id', checkResourceIdHandler, updateHandler);
router.delete('/{:id}', deleteHandler);

export default router;
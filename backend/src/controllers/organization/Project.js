// BACKEND/controller/organization/Project.js
import {Op} from 'sequelize';
import {getProjectUsers} from '#controllers';
import {Project, ProjectUser} from '#models';
import sequelize from '#utils/database.js';
import randomId from '#utils/randomId.js';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';

/**
 * Retrieves one Project by its ID or all Projects if ID is not provided.
 * @param {number} id - optional - Project ID to fetch a specific project
 * @param {number|number[]} manager - optional - Manager user ID(s) to filter projects by
 * @param {boolean} get_members - optional - Should members be fetched for the found Projects?
 * @returns {Promise<Object|Array|null>} Single Project, array of Projects, or null
 */
export async function getProject({ id, manager, get_members = true } = {}) {
    async function expandProject(project) {
        if (get_members)
            project.members = await getProjectUsers(project.id);

        return project;
    }

    // Logic if no ID is provided - fetch all Projects
    if (!id || isNaN(id)) {
        const where = {};
        if (manager)
            where.manager = manager;

        const projects = await Project.findAll({
            where,
            order: [['id', 'ASC']],
            raw: true
        });

        if (!projects || projects.length === 0) {
            return [];
        }

        return await Promise.all(projects.map(project => expandProject(project)));
    }

    // Logic if the ID is provided - fetch a specific Project
    const project = await Project.findOne({ where: { id }, raw: true });

    if (!project) {
        return null;
    }

    return await expandProject(project);
}

/**
 * Creates a new Project.
 * @param {Object} data - Project data
 * @param {string} data.name - Project name
 * @param {number} [data.manager] - optional - Manager user ID
 * @param {string} [data.description] - optional - Project description
 * @param {Date} data.startDate - Project start date
 * @param {Date} [data.endDate] - optional - Project end date
 * @param {Object} [data.data] - optional - Additional JSON data
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createProject(data) {
    if (!data.name || !data.startDate) {
        return {
            success: false,
            message: 'Mandatory data (name, startDate) not provided.'
        };
    }

    if (await Project.findOne({ where: { name: data.name } })) {
        return {
            success: false,
            message: 'A project with this name already exists.'
        };
    }

    const project = await Project.create({
        id: await randomId(Project),
        name: data.name,
        manager: data.manager || null,
        description: data.description || null,
        startDate: data.startDate,
        endDate: data.endDate || null,
        data: data.data || null
    });

    return {
        success: true,
        message: 'Project created successfully.',
        id: project.id
    };
}

/**
 * Updates an existing Project.
 * @param {number} id - Project ID
 * @param {Object} data - Project data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateProject(id, data) {
    if (!id) {
        return {
            success: false,
            message: 'Project ID not provided.'
        };
    }

    const project = await Project.findOne({ where: { id } });

    if (!project) {
        return {
            success: false,
            message: 'Project not found.'
        };
    }

    if (data.name && await Project.findOne({ where: { id: { [Op.ne]: id }, name: data.name } })) {
        return {
            success: false,
            message: 'A project with this name already exists.'
        };
    }

    await project.update(data);

    return {
        success: true,
        message: 'Project updated successfully.'
    };
}

/**
 * Deletes one or multiple Projects and their assignments.
 * @param {number|number[]} id - Project ID or array of Project IDs
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteProject(id) {
    if (!isNumberOrNumberArray(id)) {
        return {
            success: false,
            message: `Invalid Project ID${Array.isArray(id) ? 's' : ''} provided.`
        };
    }

    const transaction = await sequelize.transaction();

    try {
        const deletedProjects = await Project.destroy({ where: { id }, transaction });

        if (!deletedProjects) {
            await transaction.rollback();
            return {
                success: false,
                message: `No Projects found to delete for provided ID${Array.isArray(id) && id.length > 1 ? 's' : ''}: ${Array.isArray(id) ? id.join(', ') : id}`
            };
        }

        await ProjectUser.destroy({ where: { project: id }, transaction });

        await transaction.commit();

        return {
            success: true,
            message: `${deletedProjects} Project${deletedProjects > 1 ? 's' : ''} deleted successfully.`,
            deletedCount: deletedProjects
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

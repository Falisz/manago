// BACKEND/controller/projects.js
import { Project, ProjectUser } from '../models/projects.js';
import { User } from '../models/users.js';
import { Op } from 'sequelize';
import sequelize from '../utils/database.js';
import randomId from '../utils/randomId.js';
import isNumberOrNumberArray from "../utils/isNumberOrNumberArray.js";

/**
 * Retrieves one Project by its ID or all Projects if ID is not provided.
 * @param {number} id - optional - Project ID to fetch a specific project
 * @param {boolean} get_members - optional - Should members be fetched for the found Projects?
 * @returns {Promise<Object|Array|null>} Single Project, array of Projects, or null
 */
export async function getProject({ id, get_members = true } = {}) {
    async function expandProject(project) {
        if (get_members) {
            project.members = await getProjectUsers(project.id);
        }
        return project;
    }

    // Logic if no ID is provided - fetch all Projects
    if (!id || isNaN(id)) {
        const projects = await Project.findAll({
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

/**
 * Retrieves members of a Project.
 * @param {number} projectId - Project ID
 * @param {boolean} include_details - Optional - Should user and project details be included
 * @returns {Promise<Array|null>} Array of user objects
 */
export async function getProjectUsers(projectId, include_details = false) {
    if (!projectId) {
        return [];
    }

    const projectUsers = await ProjectUser.findAll({
        where: { project: projectId },
        include: include_details ? [
            {
                model: Project,
                attributes: ['id', 'name'],
            },
            {
                model: User,
                attributes: ['id', 'first_name', 'last_name']
            }
        ] : []
    });

    if (!include_details) {
        return projectUsers.map(pu => ({
            id: pu.user
        }));
    }

    return projectUsers.map(projectUser => ({
        id: projectUser['User'].id,
        first_name: projectUser['User'].first_name,
        last_name: projectUser['User'].last_name,
        project: { id: projectUser['Project'].id, name: projectUser['Project'].name }
    }));
}

/**
 * Updates Project Members assigned to a Project based on mode.
 * @param {Array<number>} projectIds - Array of Project IDs
 * @param {Array<number>} userIds - Array of User IDs to be assigned/removed
 * @param {string} mode - Update mode ('add', 'set', 'del')
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateProjectUsers(projectIds, userIds, mode = 'add') {
    if (!Array.isArray(projectIds) || !Array.isArray(userIds)) {
        return { success: false, message: 'Invalid Project or User IDs provided.', status: 400 };
    }

    if (!['add', 'set', 'del'].includes(mode)) {
        return { success: false, message: 'Invalid mode. Must be "add", "set", or "del".', status: 400 };
    }

    const transaction = await sequelize.transaction();

    try {
        if (mode === 'add') {
            const currentAssignments = await ProjectUser.findAll({
                where: {
                    project: projectIds,
                    user: userIds
                },
                transaction
            });

            const existingPairs = new Set(currentAssignments.map(pu => `${pu.project}-${pu.user}`));
            const newAssignments = [];

            for (const projectId of projectIds) {
                for (const userId of userIds) {
                    if (!existingPairs.has(`${projectId}-${userId}`)) {
                        newAssignments.push({ project: projectId, user: userId });
                    }
                }
            }

            if (newAssignments.length > 0) {
                await ProjectUser.bulkCreate(newAssignments, { transaction });
            }

            await transaction.commit();

            return {
                success: true,
                message: `Project Members assigned successfully. ${newAssignments.length} new assignments created.`
            };
        } else if (mode === 'set') {
            await ProjectUser.destroy({
                where: { project: projectIds },
                transaction
            });

            for (const projectId of projectIds) {
                const newAssignments = userIds.map(userId => ({
                    project: projectId,
                    user: userId
                }));

                await ProjectUser.bulkCreate(newAssignments, { transaction });
            }

            await transaction.commit();

            return {
                success: true,
                message: 'Project Members set successfully.'
            };
        } else if (mode === 'del') {
            const deletedCount = await ProjectUser.destroy({
                where: { project: projectIds, user: userIds },
                transaction
            });

            await transaction.commit();

            return {
                success: true,
                message: `Project Members removed successfully. ${deletedCount} assignments removed.`
            };
        }
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
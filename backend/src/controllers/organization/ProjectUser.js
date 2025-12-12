// BACKEND/controller/organization/ProjectUser.js
import {Project, ProjectUser, User} from "#models";
import sequelize from "#utils/database.js";

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
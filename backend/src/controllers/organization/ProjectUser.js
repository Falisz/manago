// BACKEND/controller/organization/ProjectUser.js
import {Project, ProjectRole, ProjectUser, User} from "#models";
import sequelize from "#utils/database.js";

/**
 * Retrieves members of a Project.
 * @param {number} project - Project ID
 * @param {number} user - User ID
 * @param {number || null} [role] - Optional - Role filter (0: member, 1: leader, 2: manager)
 * @returns {Promise<Array|null>} Array of user objects
 */
export async function getProjectUsers({project, user, role} ={}) {

    let projectIds;

    if (project)
        projectIds = [project];
    else if (user)
        projectIds = (await ProjectUser.findAll({where: {project, role}})).map(pu => pu['team']);
    else return [];

    projectIds = [...new Set(projectIds)];

    const where = { project: projectIds };

    if (role)
        where.role = role;

    const projectUsers = await ProjectUser.findAll({
        where,
        include: [
            {
                model: Project,
                attributes: ['id', 'name'],
            },
            {
                model: User,
                attributes: ['id', 'first_name', 'last_name']
            },
            {
                model: ProjectRole,
                attributes: ['id', 'name']
            }
        ]
    });

    if (projectUsers.length === 0)
        return [];

    if (project) {
        let members = projectUsers.map(pU => ({
            id: pU['User'].id,
            first_name: pU['User'].first_name,
            last_name: pU['User'].last_name,
            role: { id: pU['ProjectRole'].id, name: pU['ProjectRole'].name },
            project: { id: pU['Project'].id, name: pU['Project'].name },
        }));

        const seenUsers = new Set();
        const filteredMembers = [];

        for (const member of members) {
            const userId = member.id;

            if (!seenUsers.has(userId)) {
                seenUsers.add(userId);
                filteredMembers.push(member);
            }
        }

        return filteredMembers;

    } else if (user) {
        return projectUsers.map(pU => ({
            id: pU['project'],
            name: pU['Project']['name'],
            role: pU['ProjectRole']['name'],
        }));

    } else
        return [];
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
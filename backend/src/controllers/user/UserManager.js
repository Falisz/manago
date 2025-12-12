// BACKEND/controller/user/UserManager.js
import {User, UserManager} from '#models';
import sequelize from '#utils/database.js';

/**
 * Retrieves Managers assigned to a specific userId, or Managed Users assigned to a specific managerId.
 * @param {number} user - User ID (optional)
 * @param {number} managerId - Manager ID (optional)
 * @returns {Promise<UserManager[]|null>} Array of Managers assigned to the User or Users assigned to the Manager,
 * or null if neither ID is provided.
 */
export async function getUserManagers({
                                          user,
                                          manager,
                                          include_all_users = false,
                                          include_all_managers = false,
                                          visited = new Set(),
                                      } = {}) {
    if (!user && !manager)
        return [];

    const userIds = user == null ?
        [] : (Array.isArray(user) ? user : [user]).map(Number).filter(Number.isFinite);

    const managerIds = manager == null ?
        [] : (Array.isArray(manager) ? manager : [manager]).map(Number).filter(Number.isFinite);

    const queryingByManager = managerIds.length > 0;

    const seeds = (queryingByManager ? managerIds : userIds).filter(id => !visited.has(id));

    if (seeds.length === 0)
        return [];

    const rows = await UserManager.findAll({
        where: queryingByManager ? { manager: seeds } : { user: seeds },
        include: [{
            model: User,
            as: (queryingByManager ? 'User' : 'Manager'),
            attributes: ['id', 'first_name', 'last_name'],
        }],
    });

    const directPeople = rows.map(r => r[queryingByManager ? 'User' : 'Manager'].toJSON());

    const uniqueDirectById = new Map(directPeople.map(u => [u.id, u]));

    let recursiveResults = [];

    if (queryingByManager && include_all_users) {
        const nextManagers = rows.map(r => r.user).filter(id => id != null && !visited.has(id));

        if (nextManagers.length > 0)
            recursiveResults = await getUserManagers({ manager: nextManagers, include_all_users, visited });

    } else if (!queryingByManager && include_all_managers) {
        const nextUsers = rows.map(r => r.manager).filter(id => id != null && !visited.has(id));

        if (nextUsers.length > 0)
            recursiveResults = await getUserManagers({ user: nextUsers, include_all_managers, visited });
    }

    for (const u of recursiveResults)
        uniqueDirectById.set(u.id, u);

    return Array.from(uniqueDirectById.values());
}

/**
 * Updates Managers assigned to a User based on mode.
 * - 'add': Appends managers to Users if they don't exist yet
 * - 'set': Sets provided managers to Users and removes any other manager assignments
 * - 'del': Removes provided managers from Users if they have them
 * @param {Array<{number}>} userIds - Array of User IDs for whom Managers would be updated
 * @param {Array<{number}>} managerIds - Array of Manager IDs to be assigned/removed.
 * @param {string} mode - Update mode
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateUserManagers(userIds, managerIds, mode = 'add') {
    if (!Array.isArray(userIds) || !Array.isArray(managerIds))
        return { success: false, message: 'Invalid user or manager IDs provided.' };

    if (!['add', 'set', 'del'].includes(mode))
        return { success: false, message: 'Invalid mode. Must be "add", "set", or "del".' };

    const transaction = await sequelize.transaction();

    try {
        if (mode === 'add') {
            const currentAssignments = await UserManager.findAll({
                where: {
                    user: userIds,
                    manager: managerIds
                },
                transaction
            });

            const existingPairs = new Set(currentAssignments.map(um => `${um.user}-${um.manager}`));
            const newAssignments = [];

            for (const userId of userIds) {
                for (const managerId of managerIds) {
                    if (!existingPairs.has(`${userId}-${managerId}`)) {
                        newAssignments.push({ user: userId, manager: managerId });
                    }
                }
            }

            if (newAssignments.length > 0)
                await UserManager.bulkCreate(newAssignments, { transaction });

            await transaction.commit();

            return {
                success: true,
                message: `Managers assigned successfully. ${newAssignments.length} new assignments created.`
            };

        } else if (mode === 'set') {
            await UserManager.destroy({
                where: { user: userIds },
                transaction
            });

            for (const userId of userIds) {
                const newAssignments = managerIds.map(managerId => ({
                    user: userId,
                    manager: managerId
                }));

                await UserManager.bulkCreate(newAssignments, { transaction });
            }

            await transaction.commit();

            return {
                success: true,
                message: 'Managers set successfully.'
            };

        } else if (mode === 'del') {
            const deletedCount = await UserManager.destroy({
                where: { user: userIds, manager: managerIds },
                transaction
            });

            await transaction.commit();

            return {
                success: true,
                message: `Managers removed successfully. ${deletedCount} assignments removed.`
            };
        }

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
// BACKEND/controller/user/UserRole.js
import {Role, User, UserRole} from '#models';
import sequelize from '#utils/database.js';

/**
 * Retrieves Roles assigned to a specific userId or all users assigned to a specific roleId.
 * @param {number|null} user - optional - User ID
 * @param {number|null} role - optional - Role ID
 * @param {boolean} include_lower_roles - optional - whether to include lower-level Roles
 * @returns {Promise<Object[]|{success: boolean, message: string}>} Array of Roles/Users or error
 */
export async function getUserRoles({user, role} = {}) {
    if (!user && !role)
        return null;

    let result = await UserRole.findAll({
        where: role ? { role } : { user },
        include: role ?
            [ { model: User, attributes: ['id', 'first_name', 'last_name'] }] :
            [ { model: Role, attributes: ['id', 'name'] } ]
    });

    return result.map(item => item[role ? 'User' : 'Role' ].toJSON()) || null;
}

/**
 * Updates Roles assigned to a User based on mode.
 * - 'add': Appends Roles to users if they don't exist yet
 * - 'set': Sets provided Roles to users and removes any other Role assignments
 * - 'del': Removes provided Roles from users if they have them
 * @param {Array<{number}>} userIds - Array of User IDs for whom Roles would be updated
 * @param {Array<{number}>} roleIds - Array of Role IDs to be assigned/removed.
 * @param {string} mode - Update mode
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateUserRoles(userIds, roleIds, mode = 'add') {
    if (!Array.isArray(userIds) || !Array.isArray(roleIds))
        return { success: false, message: 'Invalid user or role IDs provided.' };

    if (!['add', 'set', 'del'].includes(mode))
        return { success: false, message: 'Invalid mode. Must be "add", "set", or "del".' };

    const transaction = await sequelize.transaction();

    try {
        if (mode === 'add') {
            const currentAssignments = await UserRole.findAll({
                where: {
                    user: userIds,
                    role: roleIds
                },
                transaction
            });

            const existingPairs = new Set(currentAssignments.map(ur => `${ur.user}-${ur.role}`));
            const newAssignments = [];

            for (const userId of userIds) {
                for (const roleId of roleIds) {
                    if (!existingPairs.has(`${userId}-${roleId}`)) {
                        newAssignments.push({ user: userId, role: roleId });
                    }
                }
            }

            if (newAssignments.length > 0) {
                await UserRole.bulkCreate(newAssignments, { transaction });
            }

            await transaction.commit();
            return {
                success: true,
                message: `Roles assigned successfully. ${newAssignments.length} new assignments created.`
            };

        } else if (mode === 'set') {
            await UserRole.destroy({
                where: { user: userIds },
                transaction
            });

            for (const userId of userIds) {
                const newAssignments = roleIds.filter(roleId => roleId != null).map(roleId => ({
                    user: userId,
                    role: roleId
                }));

                await UserRole.bulkCreate(newAssignments, { transaction });
            }

            await transaction.commit();
            return {
                success: true,
                message: 'Managers set successfully.'
            };

        } else if (mode === 'del') {
            const deletedCount = await UserRole.destroy({
                where: { user: userIds, role: roleIds },
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

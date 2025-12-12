// BACKEND/controller/organization/BranchUser.js
import {Op} from 'sequelize';
import {Branch, BranchUser, BranchRole, User} from '#models';
import sequelize from '#utils/database.js';

/**
 * Retrieves members of a Branch, optionally filtered by role.
 * @param {number} branchId - Branch ID
 * @param {number|null} [role] - Optional - Role filter
 * @param {boolean} include_details - Optional - Should user and branch details be included
 * @returns {Promise<Array|null>} Array of user objects
 */
export async function getBranchUsers(branchId, role = null, include_details = false) {
    if (!branchId) {
        return [];
    }

    const where = { branch: branchId };

    if (role !== null && role !== undefined) {
        where.role = role;
    }

    const branchUsers = await BranchUser.findAll({
        where,
        include: include_details ? [
            {
                model: Branch,
                attributes: ['id', 'name'],
            },
            {
                model: User,
                attributes: ['id', 'first_name', 'last_name']
            },
            {
                model: BranchRole,
                attributes: ['id', 'name']
            }
        ] : []
    });

    if (!include_details) {
        return branchUsers.map(bu => ({
            id: bu.user,
            role: bu.role
        }));
    }

    return branchUsers.map(branchUser => ({
        id: branchUser['User'].id,
        first_name: branchUser['User'].first_name,
        last_name: branchUser['User'].last_name,
        role: branchUser.role,
        role_name: branchUser['BranchRole'].name,
        branch: { id: branchUser['Branch'].id, name: branchUser['Branch'].name }
    }));
}

/**
 * Updates Branch Members assigned to a Branch based on mode.
 * @param {Array<number>} branchIds - Array of Branch IDs
 * @param {Array<number>} userIds - Array of User IDs to be assigned/removed
 * @param {number} roleId - Role to set for provided users in 'add' and 'set' modes
 * @param {string} mode - Update mode ('add', 'set', 'del')
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateBranchUsers(branchIds, userIds, roleId = 1, mode = 'add') {
    if (!Array.isArray(branchIds) || !Array.isArray(userIds)) {
        return { success: false, message: 'Invalid Branch or User IDs provided.', status: 400 };
    }

    if (!['add', 'set', 'del'].includes(mode)) {
        return { success: false, message: 'Invalid mode. Must be "add", "set", or "del".', status: 400 };
    }

    const transaction = await sequelize.transaction();

    try {
        if (mode === 'add') {
            const currentAssignments = await BranchUser.findAll({
                where: {
                    branch: branchIds,
                    user: userIds
                },
                transaction
            });

            const existingPairs = new Set(currentAssignments.map(bu => `${bu.branch}-${bu.user}`));
            const newAssignments = [];

            for (const branchId of branchIds) {
                for (const userId of userIds) {
                    if (!existingPairs.has(`${branchId}-${userId}`)) {
                        newAssignments.push({ branch: branchId, user: userId, role: roleId });
                    }
                }
            }

            if (newAssignments.length > 0) {
                await BranchUser.bulkCreate(newAssignments, { transaction });
            }

            await transaction.commit();

            return {
                success: true,
                message: `Branch Members assigned successfully. ${newAssignments.length} new assignments created.`
            };
        } else if (mode === 'set') {
            await BranchUser.destroy({
                where: { [Op.or]: [{ branch: branchIds, role: roleId }, { branch: branchIds, user: userIds }] },
                transaction
            });

            for (const branchId of branchIds) {
                const newAssignments = userIds.map(userId => ({
                    branch: branchId,
                    user: userId,
                    role: roleId
                }));

                await BranchUser.bulkCreate(newAssignments, { transaction });
            }

            await transaction.commit();

            return {
                success: true,
                message: 'Branch Members set successfully.'
            };
        } else if (mode === 'del') {
            const deletedCount = await BranchUser.destroy({
                where: { branch: branchIds, user: userIds },
                transaction
            });

            await transaction.commit();

            return {
                success: true,
                message: `Branch Members removed successfully. ${deletedCount} assignments removed.`
            };
        }
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
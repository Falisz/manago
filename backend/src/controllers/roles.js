// BACKEND/controller/roles.js
import sequelize from '../utils/database.js';
import {User, Role, UserRole} from '../models/users.js';

/**
 * @typedef {Object} UserRoleData
 * @property {Object} Role - Sequelize Role association
 * @property {function} toJSON - Sequelize toJSON method
 */

/**
 * Retrieves one or all roles.
 * @param {number|null} roleId - Optional role ID to fetch a specific role
 * @returns {Promise<Object|Object[]|null>} Single role, array of roles, or null
 */
export async function getRole(id) {

    if (!id || isNaN(id)) {
        const roles = await Role.findAll({ order: [['id', 'ASC']] });

        return await Promise.all(
            (roles || []).map(async role => {
                const roleObj = { ...role.toJSON() };
                roleObj.users = await getUsersWithRole(roleObj.id);
                return roleObj;
            })
        );
    }

    let role = await Role.findOne({
        where: { id },
    });

    if (!role) {
        return null
    }

    return {
        ...role.toJSON(),
        users: await getUsersWithRole(id),
    };
}

/**
 * Creates a new role.
 * @param {Object} data - Role data
 * @param {string} data.name - Role name
 * @param {string} data.description - Role description
 * @returns {Promise<{success: boolean, message: string, role?: Object}>}
 */
export async function createRole(data) {

    if (!data.name) {
        return {success: false, message: 'Mandatory data not provided.'};
    }

    if (await Role.findOne({where: {name: data.name}})) {
        return {success: false, message: 'The role with this exact name already exists.'};
    }

    const role = await Role.create({
        name: data.name,
        description: data?.description || null,
        system_default: false,
    });

    return {success: true, message: 'Role created successfully.', role: role.toJSON()};
}

/**
 * Updates an existing role.
 * @param {number} roleId - Role ID
 * @param {Object} data - Role data to update
 * @returns {Promise<{success: boolean, message: string, role?: Object}>}
 */
export async function updateRole(roleId, data) {
    if (!roleId) {
        return {success: false, message: 'Role ID not provided.'};
    }

    const role = await Role.findOne({
        where: { id: roleId },
    });

    if (!role) {
        return {success: false, message: 'Role not found.'};
    }

    const roleUpdate = {};

    if (data.name) roleUpdate.name = data.name;
    if (data.description) roleUpdate.description = data.description;
    roleUpdate.system_default = false;

    const updatedRole = await role.update(roleUpdate);

    return {success: true, message: 'Role updated successfully.', role: updatedRole.toJSON()};
}

/**
 * Deletes one or multiple roles and their assignments.
 * @param {number|number[]} roleIds - Single role ID or array of role IDs
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteRole(roleIds) {
    const rolesToDelete = Array.isArray(roleIds) ? roleIds : [roleIds];

    if (!rolesToDelete || rolesToDelete.length === 0 || rolesToDelete.some(id => id == null)) {
        return { success: false, message: 'Role ID(s) not provided or invalid.' };
    }

    const transaction = await sequelize.transaction();

    try {
        const roles = await Role.findAll({
            where: { id: rolesToDelete },
            transaction
        });

        if (roles.length === 0) {
            await transaction.rollback();
            return {
                success: false,
                message: `No roles found for provided ID(s): ${rolesToDelete.join(', ')}`
            };
        }

        const foundRoleIds = roles.map(role => role.id);
        const missingRoleIds = rolesToDelete.filter(id => !foundRoleIds.includes(id));

        if (missingRoleIds.length > 0) {
            console.warn(`Roles not found and will be skipped: ${missingRoleIds.join(', ')}`);
        }

        const roleAssignments = await UserRole.findAll({
            where: { role: foundRoleIds },
            transaction
        });

        await Promise.all(
            roleAssignments.map(assignment => assignment.destroy({ transaction }))
        );

        await Promise.all(
            roles.map(role => role.destroy({ transaction }))
        );

        await transaction.commit();

        return {
            success: true,
            message: `Role(s) removed successfully. ${roles.length} role(s) deleted, ${roleAssignments.length} assignment(s) removed.`,
            deletedCount: roles.length
        };

    } catch (error) {
        await transaction.rollback();
        return {
            success: false,
            message: `Failed to delete role(s): ${error.message}`
        };
    }
}

/**
 * Retrieves roles assigned to a user.
 * @param {number} userId - User ID
 * @returns {Promise<Object[]|{success: boolean, message: string}>} Array of roles or error
 */
export async function getUserRoles(userId) {
    if (!userId) {
        return {success: false, message: 'User ID not provided.'};
    }

    const roles = await UserRole.findAll({
        attributes: {exclude: ['id']},
        where: { user: userId },
        order: [['role', 'ASC']],
        include: [
            { model: Role }
        ],
    });

    return roles.map(role => {
        role = {
            ...role.Role.toJSON(),
        };
        delete role.Role;
        return role;
    }) || null;
}

/**
 * Updates Roles assigned to a User based on mode.
 * - 'add': Appends roles to users if they don't exist yet
 * - 'set': Sets provided roles to users and removes any other role assignments
 * - 'del': Removes provided roles from users if they have them
 * @param {Array<{number}>} userIds - Array of User IDs for whom Roles would be updated
 * @param {Array<{number}>} roleIds - Array of Role IDs to be assigned/removed.
 * @param {string} mode - Update mode
 * @returns {Promise<{success: boolean, message: string, status?: number}>}
 */
export async function updateUserRoles(userIds, roleIds, mode = 'add') {
    if (!Array.isArray(userIds) || !Array.isArray(roleIds)) {
        return { success: false, message: 'Invalid user or role IDs provided.', status: 400 };
    }

    if (!['add', 'set', 'del'].includes(mode)) {
        return { success: false, message: 'Invalid mode. Must be "add", "set", or "del".', status: 400 };
    }

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
            for (const userId of userIds) {
                await UserRole.destroy({
                    where: { user: userId },
                    transaction
                });

                const newAssignments = roleIds.map(roleId => ({
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
                where: { user: userIds, manager: roleIds },
                transaction
            });

            await transaction.commit();
            return {
                success: true,
                message: `Managers removed successfully. ${deletedCount} assignments removed.`
            };
        }

    } catch (err) {
        await transaction.rollback();
        return { success: false, message: `Failed to ${mode} managers: ${err.message}` };
    }
}

/**
 * Retrieves all users for a given role ID.
 * @param {number} roleId - Role ID
 * @returns {Promise<Array<{id: number, first_name: string, last_name: string}>>}
 */
export async function getUsersWithRole(roleId) {
    if (!roleId) return [];

    const userRoles = await UserRole.findAll({
        where: { role: roleId },
        include: [{ model: User, attributes: ['id', 'first_name', 'last_name'] }]
    });

    return userRoles
        .map(ur => ({
            id: ur.User?.id,
            first_name: ur.User?.first_name,
            last_name: ur.User?.last_name
        }))
        .filter(u => u.id);
}
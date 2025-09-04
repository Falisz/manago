// BACKEND/controller/roles.js
import sequelize from '../db.js';
import Role from '../models/role.js';
import User, { UserDetails, UserRole } from '../models/user.js';

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
export async function getRole(roleId) {
    let role = await Role.findOne({
        where: { id: roleId },
    });

    if (!role) {
        return null
    }

    return {
        ...role.toJSON(),
        users: await getUsersWithRole(roleId),
    };
}
/**
 * Retrieves all roles.
 * @returns {Promise<Object|Object[]|null>} Array of roles or null
 */
export async function getRoles() {
    const roles = await Role.findAll({order: [['id', 'ASC']]});

    return await Promise.all(
        (roles || []).map(async role => {
            const roleObj = { ...role.toJSON() };
            roleObj.users = await getUsersWithRole(roleObj.id);
            return roleObj;
        })
    );
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
 * Retrieves all users for a given role ID.
 * @param {number} roleId - Role ID
 * @returns {Promise<Array<{id: number, first_name: string, last_name: string}>>}
 */
export async function getUsersWithRole(roleId) {
    if (!roleId) return [];

    const userRoles = await UserRole.findAll({
        where: { role: roleId },
        include: [
            {
                model: User,
                attributes: ['id'],
                include: [
                    {
                        model: UserDetails,
                        as: 'UserDetails',
                        attributes: ['first_name', 'last_name']
                    }
                ]
            }
        ]
    });

    return userRoles
        .map(ur => ({
            id: ur.User?.id,
            first_name: ur.User?.UserDetails?.first_name,
            last_name: ur.User?.UserDetails?.last_name
        }))
        .filter(u => u.id);
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
 * Deletes a role and its assignments.
 * @param {number} roleId - Role ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteRole(roleId) {
    if (!roleId) {
        return {success: false, message: 'Role ID not provided.'};
    }

    const transaction = await sequelize.transaction();

    const role = await Role.findOne({
        where: { id: roleId },
        transaction
    });

    if (!role) {
        await transaction.rollback();
        return { success: false, message: 'Role not found or already removed.' };
    }

    const roleAssignments = await UserRole.findAll({
        where: {role: roleId},
        transaction
    });

    await Promise.all(
        roleAssignments.map(assignment => assignment.destroy({ transaction }))
    );

    await role.destroy({ transaction });

    await transaction.commit();
    return { success: true, message: 'Role removed successfully.' };
}

/**
 * Updates roles assigned to a user.
 * @param {number} userId - User ID
 * @param {number[]} roleIds - Array of role IDs
 * @returns {Promise<{success: boolean, message: string, status?: number}>}
 */
export async function updateUserRoles(userId, roleIds) {
    if (!userId || isNaN(userId)) {
        return { success: false, message: 'Invalid user ID provided.', status: 400 };
    }

    if (!Array.isArray(roleIds) || roleIds.some(id => isNaN(id))) {
        return { success: false, message: 'Invalid role IDs provided. Must be an array of integers.', status: 400 };
    }

    const transaction = await sequelize.transaction();

    const existingRoles = await Role.findAll({
        where: { id: roleIds },
        attributes: ['id'],
        transaction
    });

    const existingRoleIds = existingRoles.map(role => role.id);
    const invalidRoleIds = roleIds.filter(id => !existingRoleIds.includes(id));

    if (invalidRoleIds.length > 0) {
        await transaction.rollback();
        return { success: false, message: `Invalid role IDs: ${invalidRoleIds.join(', ')}`, status: 400 };
    }

    const currentUserRoles = await UserRole.findAll({
        where: { user: userId },
        attributes: ['role'],
        transaction
    });

    const currentRoleIds = currentUserRoles.map(ur => ur.role);

    const rolesToAdd = roleIds.filter(id => !currentRoleIds.includes(id));
    const rolesToRemove = currentRoleIds.filter(id => !roleIds.includes(id));

    await Promise.all(
        rolesToAdd.map(roleId =>
            UserRole.create({ user: userId, role: roleId }, { transaction })
        )
    );

    await UserRole.destroy({
        where: {
            user: userId,
            role: rolesToRemove
        },
        transaction
    });

    await transaction.commit();
    return { success: true, message: 'User roles updated successfully.' };
}
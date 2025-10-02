// BACKEND/controller/roles.js
import sequelize from '../utils/database.js';
import {User, Role, UserRole} from '../models/users.js';
import randomId from '../utils/randomId.js';
import isNumberOrNumberArray from '../utils/isNumberOrNumberArray.js';

/**
 * Retrieves one Role by its ID or all Roles if an ID is not provided.
 * @param {number|null} id - optional - Role ID to fetch a specific Role
 * @param {boolean} users - optional - whether to include users assigned to the Role(s)
 * @returns {Promise<Object|Object[]|null>} Single Role, array of Roles, or null
 */
export async function getRole({id, users=true} = {}) {

    // Logic if no ID is provided - fetch all Roles
    if (!id || isNaN(id)) {
        const roles = await Role.findAll({ 
            order: [['id', 'ASC']] 
        });

        if (!roles || roles.length === 0)
            return [];

        return await Promise.all(roles.map(async role => {
                const roleData = role.toJSON();

                if (users)
                    roleData.users = await getUserRoles({ roleId: role.id });

                return roleData;
            })
        ) || [];
    }

    // Logic if ID is provided - fetch specific Role
    let role = await Role.findOne({ where: { id } });

    if (!role)
        return null;

    role = role.toJSON ? role : role.toJSON();

    if (users) 
        role.users = await getUserRoles({ roleId: id });

    return role;
}

/**
 * Creates a new Role.
 * @param {Object} data - Role data
 * @param {string} data.name - Role name
 * @param {string} data.description - optional - Role description
 * @returns {Promise<{success: boolean, message: string, role?: Object}>}
 */
export async function createRole(data) {

    if (!data.name)
        return {
            success: false, 
            message: 'Name is required to create a new Role!'
        };

    if (await Role.findOne({ where: { name: data.name }}))
        return {
            success: false, 
            message: 'The Role with this exact name already exists.'
        };

    const role = await Role.create({
        id: randomId(Role),
        name: data.name,
        description: data.description || null,
        system_default: false,
    });

    return {
        success: true, 
        message: 'Role created successfully.', 
        role: role.toJSON()
    };
}

/**
 * Updates an existing Role.
 * @param {number} id - Role ID
 * @param {Object} data - Role data to update
 * @returns {Promise<{success: boolean, message: string, role?: Object}>}
 */
export async function updateRole(id, data) {

    if (!id)
        return {
            success: false, 
            message: 'Role ID not provided.'
        };

    const role = await Role.findOne({ where: { id } });

    if (!role)
        return {
            success: false, 
            message: 'Role not found.'
        };

    if (data.name && await Role.findOne({ where: { name: data.name, id: { [sequelize.Op.ne]: id } }}))
        return {
            success: false, 
            message: 'The other Role with this exact name already exists.'
        };

    const updatedRole = await role.update(data);

    return {
        success: true, 
        message: 'Role updated successfully.', 
        role: updatedRole.toJSON()
    };
}

/**
 * Deletes one or multiple Roles and their assignments.
 * @param {number|number[]} id - Single Role ID or array of Role IDs
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteRole(id) {

    if (!isNumberOrNumberArray(id))
        return { 
            success: false, 
            message: `Invalid Role ID${Array.isArray(id) ? 's' : ''} provided.` 
        };

    const transaction = await sequelize.transaction();

    try {
        const deletedRoles = await Role.destroy({ where: { id }, transaction });

        if (!deletedRoles) {
            await transaction.rollback();
            return { 
                success: false, 
                message: `No Roles found to delete for provided ID${Array.isArray(id) && id.length > 1 ? 's' : ''}:
                 ${Array.isArray(id) ? id.join(', ') : id}` 
            };
        }

        await UserRole.destroy({ where: { role: id }, transaction });

        await transaction.commit();

        return {
            success: true,
            message: `${deletedRoles} Role${deletedRoles > 1 ? 's' : ''} deleted successfully.`,
            deletedCount: deletedRoles
        };

    } catch (error) {
        await transaction.rollback();
        return {
            success: false,
            message: `Failed to delete Role${Array.isArray(id) && id.length > 1 ? 's' : ''}: ${error.message}`
        };
    }
}

/**
 * Retrieves Roles assigned to a specific userId or all users assigned to a specific roleId.
 * @param {number|null} userId - optional - User ID
 * @param {number|null} roleId - optional - Role ID
 * @returns {Promise<Object[]|{success: boolean, message: string}>} Array of Roles/Users or error
 */
export async function getUserRoles({userId, roleId}) {
    if (!userId && isNaN(userId) && !roleId && isNaN(roleId)) {
        return null;
    }

    let result = await UserRole.findAll({
        where: roleId ? { role: roleId } : {user: userId },
        include: roleId ?  
            [ { model: User, attributes: ['id', 'first_name', 'last_name'] }] :
            [ { model: Role, attributes: ['id', 'name'] } ]
    });

    return result.map(item => {
        item = {
            ...item[roleId ? 'User' : 'Role' ].toJSON(),
        };
        delete item[roleId ? 'User' : 'Role' ];
        return item;
    }) || null;
}

/**
 * Updates Roles assigned to a User based on mode.
 * - 'add': Appends Roles to users if they don't exist yet
 * - 'set': Sets provided Roles to users and removes any other Role assignments
 * - 'del': Removes provided Roles from users if they have them
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
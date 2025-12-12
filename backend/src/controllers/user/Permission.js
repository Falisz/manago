// BACKEND/controller/user/Permission.js
import {Permission, RolePermission, UserPermission, User, Role} from '#models';
import isNumberOrNumberArray from "#utils/isNumberOrNumberArray.js";

/**
 * Retrieves one Permission by its ID or all Permissions if an ID is not provided.
 * @param {number|null} id - optional - Permission ID to fetch a specific Permission
 * @returns {Promise<Object|Object[]|null>} Single Permission, array of Permissions, or null
 */
export async function getPermission({id} = {}) {
    // Logic if no ID is provided - fetch all Permissions
    if (!id || isNaN(id))
        return await Permission.findAll({ order: [['id', 'ASC']], raw: true}) || [];

    // Logic if ID is provided - fetch a specific Permission
    return await Permission.findOne({ where: { id }, raw: true });
}

/**
 * Retrieves Permissions assigned to a specific User or all Users assigned to a specific Permission.
 * @param {number|number[]|null} user - optional - a User ID or an array of User IDs
 * @param {number|number[]|null} permission - optional - a Permission ID or an array of Permission IDs
 * @returns {Promise<Object[]>} Array of Permissions/Users
 */
export async function getUserPermissions({user, permission}) {
    if (!isNumberOrNumberArray(user) && !isNumberOrNumberArray(permission))
        return [];

    let result = await UserPermission.findAll({
        where: permission ? { permission } : { user },
        include: permission ?
            [ { model: User, attributes: ['id', 'first_name', 'last_name'] } ] :
            [ { model: Permission, attributes: ['id', 'name'] } ]
    });

    return result.map(item => item[permission ? 'User' : 'Permission'].toJSON()) || [];
}

/**
 * Retrieves Permissions assigned to a specific Role or all Roles assigned to a specific Permission.
 * @param {number|number[]|null} role - optional - a Role ID or an array of Role IDs
 * @param {number|number[]|null} permission - optional - a Permission ID or an array of Permission IDs
 * @returns {Promise<Object[]>} Array of Permissions/Roles
 */
export async function getRolePermissions({role, permission}) {
    if (!isNumberOrNumberArray(role) && !isNumberOrNumberArray(permission))
        return [];

    let result = await RolePermission.findAll({
        where: permission ? { permission } : { role },
        include: permission ?
            [ { model: Role, attributes: ['id', 'name'] } ] :
            [ { model: Permission, attributes: ['id', 'name'] } ]
    });

    return result.map(item => item[permission ? 'Role' : 'Permission'].toJSON()) || [];
}
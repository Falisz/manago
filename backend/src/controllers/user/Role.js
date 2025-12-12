// BACKEND/controller/user/Role.js
import {Op} from 'sequelize';
import {getUserRoles} from '#controllers';
import {Role, UserRole} from '#models';
import randomId from '#utils/randomId.js';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';
import sequelize from '#utils/database.js';

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
            order: [['id', 'ASC']],
            raw: true
        });

        if (!roles || roles.length === 0)
            return [];

        return await Promise.all(roles.map(async role => {
                if (users)
                    role.users = await getUserRoles({role: role.id});

                return role;
            })
        );
    }

    // Logic if ID is provided - fetch a specific Role
    let role = await Role.findOne({ where: { id }, raw: true });

    if (!role)
        return null;

    if (users)
        role.users = await getUserRoles({role: id});

    return role;
}

/**
 * Creates a new Role.
 * @param {Object} data - Role data
 * @param {string} data.name - Role name
 * @param {string} data.description - optional - Role description
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
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
        id: await randomId(Role),
        name: data.name,
        description: data.description || null,
        system_default: false,
    });

    return {
        success: true,
        message: 'Role created successfully.',
        id: role.id
    };
}

/**
 * Updates an existing Role.
 * @param {number} id - Role ID
 * @param {Object} data - Role data to update
 * @returns {Promise<{success: boolean, message: string}>}
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

    if (data.name && await Role.findOne({ where: { name: data.name, id: { [Op.ne]: id } }}))
        return {
            success: false,
            message: 'The other Role with this exact name already exists.'
        };

    await role.update(data);

    return {
        success: true,
        message: 'Role updated successfully.'
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
        throw error;
    }
}
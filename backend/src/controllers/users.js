// BACKEND/controller/users.js
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import sequelize from '../utils/database.js';
import { User, UserManager, Role, UserRole } from '../models/users.js';
import { TeamUser } from '../models/teams.js';
import randomId from '../utils/randomId.js';
import isNumberOrNumberArray from '../utils/isNumberOrNumberArray.js';

/**
 * Retrieves one User by their ID or all Users if ID is not provided.
 * @param {number|string} id - optional - User ID to fetch a specific User or User group type.
 * @param {boolean} managers - optional - Should managers be added to the output User
 * @param {boolean} roles - optional - Should roles be added to the output User
 * @returns {Promise<Object|Object[]|null>} User, array of Users or null
 */
export async function getUser({id, group, roles=true, managers=true, managed_users=false} = {}) {

    // Logic if no ID is provided - fetch all Users
    if (!id || isNaN(id)) {
        const where = { removed: false };
        let include = [];

        if (group === 'all') {
            delete where.removed;
            
        } else if (group === 'employees') {
            include = [ {model: UserRole, required: true, include: [ { model: Role, where: { name: ['Employee', 'Team Leader', 'Specialist'] } } ]} ];

        } else if (group === 'managers') {
            include = [ { model: UserRole, required: true, include: [ { model: Role, where: { name: ['Manager', 'Branch Manager', 'Project Manager', 'CEO'] } } ]} ];
        }

        const users = await User.findAll({
            attributes: { exclude: ['password', 'removed'] },
            where, 
            include,
            order: [['id', 'ASC']]
        });

        if (!users || users.length === 0)
            return [];

        return await Promise.all(users.map(async user => {
            const userData = user.toJSON();

            if (roles)
                userData.roles = await getUserRoles({userId: user.id});

            if (managers)
                userData.managers = await getUserManagers({userId: user.id});

            if (managed_users)
                userData.managed_users = await getUserManagers({managerId: user.id});
            
            return userData;
        })) || [];
    }

    // Logic if the ID is provided - fetch specific User
    const user = await User.findOne({
        attributes: { exclude: ['password', 'removed'] },
        where: { id, removed: false },
        raw: true
    });

    if (!user)
        return null;

    if (roles)
        user.roles = await getUserRoles({userId: id});

    if (managers)
        user.managers = await getUserManagers({userId: id});

    if (managed_users)
        user.managed_users = await getUserManagers({managerId: id});

    return user;
}

/**
 * Creates a new User.
 * @param {Object} data - User data
 * @param {number|null} data.id - User ID
 * @param {string|null} data.login - User login
 * @param {string} data.email - User email
 * @param {string} data.password - User password
 * @param {string} data.first_name - First name
 * @param {string} data.last_name - Last name
 * @param {boolean} [data.manager_view_access=false] - Manager view access
 * @returns {Promise<{success: boolean, message: string, user?: Object}>}
 */
export async function createUser(data) {

    if (!data.email || !data.first_name || !data.last_name) 
        return {
            success: false,
            message: 'Mandatory data not provided.'
        };

    if (await User.findOne({where: {email: data.email}}))
        return {
            success: false,
            message: 'Email must be unique.'
        };

    if (data.login !== null && data.login !== undefined &&
            await User.findOne({where: {login: data.login}}))
        return {
            success: false,
            message: 'Login must be unique.'
        };

    if (data.email !== null && data.email !== undefined &&
            await User.findOne({where: {login: data.email}}))
        return {
            success: false,
            message: 'Email must be unique.'
        };

    data.id = randomId(User);

    const user = await User.create({
        id: await randomId(User),
        login: data.login || null,
        email: data.email,
        password: await bcrypt.hash(data.password || '1234', 10),
        active: true,
        removed: false,
        first_name: data.first_name,
        last_name: data.last_name,
        manager_view_access: data.manager_view_access || false,
        manager_view_enabled: false,
        manager_nav_collapsed: false
    });

    return {
        success: true, 
        message: 'User created successfully.', 
        user: user.toJSON()
    };
}

/**
 * Updates an existing User.
 * @param {number} id - User ID
 * @param {Object} data - User data to update
 * @returns {Promise<{success: boolean, message: string, user?: Object}>}
 */
export async function updateUser(id, data) {

    if (!id)
        return {
            success: false, 
            message: 'User ID not provided.'
        };

    const user = await User.findOne({ where: { id, removed: false } });

    if (!user)
        return {
            success: false, 
            message: 'User not found.'
        };

    if (data.login !== undefined && data.login !== user.login && 
        await User.findOne({ where: { login: data.login, id: { [Op.ne]: userId } } }))
            return { 
                success: false, 
                message: 'Login must be unique.' 
            };
            
    if (data.email && data.email !== user.email && 
        await User.findOne({ where: { email: data.email, id: { [Op.ne]: userId } } })) 
            return { 
                success: false, 
                message: 'Email must be unique.' 
            };
            
    if (data.password) 
        data.password = await bcrypt.hash(data.password, 10);

    const updatedUser = await user.update(data);

    return {
        success: true,
        message: 'User updated successfully.',
        user: updatedUser.toJSON()
    };
}

/**
 * Deletes one or multiple Users by marking as removed and fully deletes all their assignments.
 * @param {number|number[]} id - User ID or array of User IDs
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function removeUser(id) {

    if (!isNumberOrNumberArray(id))
        return { 
            success: false, 
            message: `Invalid User ID${Array.isArray(id) ? 's' : ''} provided.` 
        };


    const transaction = await sequelize.transaction();

    try {
        const [removedUsers] = await User.update(
            { email: null, active: false, removed: true },
            { where: { id, removed: false }, transaction }
        ); 

        if (!removedUsers) {
            await transaction.rollback();
            return { 
                success: false, 
                message: `No Users found to remove for provided ID${Array.isArray(id) && id.length > 1 ? 's' : ''}:
                 ${Array.isArray(id) ? id.join(', ') : id}` 
            };
        }

        await UserRole.destroy(
            { where: { user: id }, transaction }
        );

        await UserManager.destroy(
            { where: { [Op.or]: { user: id, manager: id} }, transaction }
        );

        await TeamUser.destroy(
            { where: { user: id }, transaction }
        );

        await transaction.commit();
        
        return { 
            success: true, 
            message: `${removedUsers} User${removedUsers > 1 ? 's' : ''} removed successfully.`,
            deletedCount: removedUsers 
        };
    } catch (error) {
        await transaction.rollback();
        return { success: false, message: `Error removing User(s): ${error.message}` };
    }
}

/**
 * Retrieves Managers assigned to a specific userId, or Managed Users assigned to a specific managerId.
 * @param {number} userId - User ID (optional)
 * @param {number} managerId - Manager ID (optional)
 * @returns {Promise<UserManager[]|null>} Array of Managers assigned to the User or Users assigned to the Manager, or null if neither ID is provided.
 */
export async function getUserManagers({ userId, managerId }) {
    if (!userId && isNaN(userId) && !managerId && isNaN(managerId)) {
        return null;
    }

    let result = await UserManager.findAll({
        where: managerId ? { manager: managerId } : { user: userId },
        include: [{
            model: User, as: (managerId ? 'User' : 'Manager' ),
            attributes: ['id', 'first_name', 'last_name']
        }]
    });

    return result.map(item => {
        item = {
            ...item[managerId ? 'User' : 'Manager'].toJSON(),
        };
        delete item[managerId ? 'User' : 'Manager'];
        return item;
    }) || null;
}

/**
* Updates Managers assigned to a User based on mode.
* - 'add': Appends managers to Users if they don't exist yet
* - 'set': Sets provided managers to Users and removes any other manager assignments
* - 'del': Removes provided managers from Users if they have them
* @param {Array<{number}>} userIds - Array of User IDs for whom Managers would be updated
* @param {Array<{number}>} managerIds - Array of Manager IDs to be assigned/removed.
* @param {string} mode - Update mode
* @returns {Promise<{success: boolean, message: string, status?: number}>}
*/
export async function updateUserManagers(userIds, managerIds, mode = 'add') {
    if (!Array.isArray(userIds) || !Array.isArray(managerIds)) {
        return { success: false, message: 'Invalid user or manager IDs provided.', status: 400 };
    }

    if (!['add', 'set', 'del'].includes(mode)) {
        return { success: false, message: 'Invalid mode. Must be "add", "set", or "del".', status: 400 };
    }

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

            if (newAssignments.length > 0) {
                await UserManager.bulkCreate(newAssignments, { transaction });
            }

            await transaction.commit();
            return {
                success: true,
                message: `Managers assigned successfully. ${newAssignments.length} new assignments created.`
            };

        } else if (mode === 'set') {
            for (const userId of userIds) {
                await UserManager.destroy({
                    where: { user: userId },
                    transaction
                });

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

    } catch (err) {
        await transaction.rollback();
        return { success: false, message: `Failed to ${mode} managers: ${err.message}` };
    }
}

/**
 * Authenticates a User by login (ID, email, or login) and password.
 * @param {string|number} login - User ID, email, or login name
 * @param {string} password - User password
 * @returns {Promise<{ valid: boolean, status?: number, message?: string, user?: Object }>}
 */
export async function authUser(login, password) {
    const isInteger = Number.isInteger(Number(login));
    const isEmailFormat = typeof login === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login);

    let user = await User.findOne({
        where: isInteger ? { id: login } : (isEmailFormat ? { email: login } : { login: login })
    });

    if (!user)
        return { 
            valid: false,
            status: 401, 
            message: 'Invalid credentials, user not found!' 
        };

    if (!user.active || user.removed)
        return { 
            valid: false, 
            status: 403, 
            user: {id: user.id}, message: 'User inactive.' 
        };

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
        return { 
            valid: false, 
            status: 401, 
            user: {id: user.id}, 
            message: 'Invalid credentials!' 
        };

    user = await getUser({id: user.id});

    return { 
        valid: true, 
        user 
    };
}

/**
 * Checks if given User has Access to Manager View.
 * @param {number} id - ID of a User
 * @returns {boolean}
 */
export async function hasManagerAccess(id) {
    if (!id)
        return false;

    const user = await User.findByPk(id);

    return user && user.manager_view_access;
}

/**
 * Checks if given User has Manager View enabled.
 * @param {number} id - ID of a User
 * @returns {boolean}
 */
export async function hasManagerView(id) {
    if (!id)
        return false;

    const user = await User.findByPk(id);

    return user && user.manager_view_enabled;
}

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
    let role = await Role.findOne({ where: { id }, raw: true });

    if (!role)
        return null;

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
        id: await randomId(Role),
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

    if (data.name && await Role.findOne({ where: { name: data.name, id: { [Op.ne]: id } }}))
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
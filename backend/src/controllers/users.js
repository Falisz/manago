// BACKEND/controller/users.js
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import sequelize from '../utils/database.js';
import { User, UserManager, Role, UserRole, Permission, UserPermission, RolePermission } from '../models/users.js';
import { TeamUser } from '../models/teams.js';
import randomId from '../utils/randomId.js';
import isNumberOrNumberArray from '../utils/isNumberOrNumberArray.js';

/**
 * Retrieves one User by their ID or all Users if ID is not provided.
 * @param {number|string} id - optional - User ID to fetch a specific User or User group type.
 * @param {string} group - optional - Kind of group users to be fetched - currently available: employees, managers
 * @param {boolean} roles - optional - Should Roles be added to the output User
 * @param {boolean} managers - optional - Should Managers be added to the output User
 * @param permissions
 * @param {boolean} managed_users - optional - Should Reportee Users be added to the output User
 * @param {boolean} removed - optional - default false - Should be removed Users included
 * @param {boolean} include_ppi - optional - Should PPI data be included
 * @param {boolean} include_configs - optional - Should User configurations be included
 * @returns {Promise<Object|Object[]|null>} User, array of Users, or null
 */
export async function getUser({id, group, roles=true, managers=true, permissions=false,
                                  managed_users=true, removed=false, include_ppi=false,
                                  include_configs=false} = {}) {

    let exclude = ['password', 'removed'];

    if (!include_ppi)
        exclude.push('login', 'email', 'address', 'city', 'postal_code', 'phone', 'country');

    if (!include_configs)
        exclude.push('locale', 'theme_mode', 'manager_view_enabled', 'manager_nav_collapsed');

    const fetchPermissions = async (user) => {
        let roleIds;

        if (user.roles)
            roleIds = user.roles.map(r => r.id);
        else
            roleIds = (await getUserRoles({user: user.id})).map(r => r.id);

        const rolePermissions = (await getRolePermissions({role: roleIds})).map(p => p.name);
        const userPermissions = (await getUserPermissions({user: user.id})).map(p => p.name);

        return [...rolePermissions, ...userPermissions];
    }

    // Logic if no ID is provided - fetch all Users
    if (!id || isNaN(id)) {
        const where = { removed };
        let include = [];

        if (group === 'employees')
            include = [{
                model: UserRole,
                required: true,
                include: [{
                    model: Role,
                    where: { name: ['Employee', 'Team Leader', 'Specialist'] }
                }]
        }];

        else if (group === 'managers')
            include = [{
                model: UserRole,
                required: true,
                include: [{
                    model: Role,
                    where: { name: ['Manager', 'Branch Manager', 'Project Manager', 'CEO'] }
                }]
            }];

        const users = await User.findAll({
            attributes: { exclude },
            where, 
            include,
            order: [['id', 'ASC']]
        });

        if (!users || users.length === 0)
            return [];

        return await Promise.all(users.map(async user => {
            user = user.toJSON();

            delete user['UserRoles'];

            if (roles)
                user.roles = await getUserRoles({user: user.id});

            if (permissions)
                user.permissions = await fetchPermissions(user);

            if (managers)
                user.managers = await getUserManagers({user: user.id});

            if (managed_users)
                user.managed_users = await getUserManagers({manager: user.id});
            
            return user;
        }));
    }

    // Logic if the ID is provided - fetch a specific User
    const user = await User.findOne({
        attributes: { exclude },
        where: { id, removed },
        raw: true
    });

    if (!user)
        return null;

    if (roles)
        user.roles = await getUserRoles({user: id});

    if (permissions)
        user.permissions = await fetchPermissions(user);

    if (managers)
        user.managers = await getUserManagers({user: id});

    if (managed_users)
        user.managed_users = await getUserManagers({manager: id});

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
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
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

    const user = await User.create({
        id: await randomId(User),
        login: data.login || null,
        email: data.email,
        password: await bcrypt.hash(data.password || '1234', 10),
        active: true,
        removed: false,
        first_name: data.first_name,
        last_name: data.last_name,
        manager_view_enabled: false,
        manager_nav_collapsed: false
    });

    return {
        success: true, 
        message: 'User created successfully.', 
        id: user.id
    };
}

/**
 * Updates an existing User.
 * @param {number} id - User ID
 * @param {Object} data - User data to update
 * @returns {Promise<{success: boolean, message: string}>}
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
        await User.findOne({ where: { login: data.login, id: { [Op.ne]: id } } }))
            return { 
                success: false, 
                message: 'Login must be unique.' 
            };
            
    if (data.email && data.email !== user.email && 
        await User.findOne({ where: { email: data.email, id: { [Op.ne]: id } } }))
            return { 
                success: false, 
                message: 'Email must be unique.' 
            };
            
    if (data.password) 
        data.password = await bcrypt.hash(data.password, 10);

    await user.update(data);

    return {
        success: true,
        message: 'User updated successfully.'
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
        throw error;
    }
}

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

/**
 * Authenticates a User by login (ID, email, or login) and password.
 * @param {string|number} login - User ID, email, or login name
 * @param {string} password - User password
 * @returns {Promise<{ success: boolean, status?: number, message?: string, id?: number }>}
 */
export async function authUser(login, password) {

    const isInteger = Number.isInteger(Number(login));

    const isEmailFormat = typeof login === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login);

    let user = await User.findOne({
        where: isInteger ? { id: login } : (isEmailFormat ? { email: login } : { login: login })
    });

    if (!user)
        return {
            success: false,
            status: 401, 
            message: 'Invalid credentials, user not found!' 
        };

    if (!user.active || user.removed)
        return {
            success: false,
            status: 403,
            message: 'User inactive.',
            id: user.id
        };

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
        return {
            success: false,
            status: 401,
            message: 'Invalid credentials!',
            id: user.id
        };

    return {
        success: true,
        message: 'Login successful!',
        id: user.id
    };
}

/**
 * Checks if a given User has Manager View enabled.
 * @param {number} id - ID of a User
 * @returns {Promise<boolean>}
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

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

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
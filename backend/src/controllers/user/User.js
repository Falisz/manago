// BACKEND/controller/user/User.js
import bcrypt from 'bcrypt';
import {Op} from 'sequelize';
import {
    getTeamUsers,
    getBranchUsers,
    getProjectUsers,
    getRolePermissions,
    getUserPermissions,
    getUserManagers,
    getUserRoles
} from '../index.js';
import {User, UserManager, Role, UserRole, TeamUser} from '#models';
import sequelize from '#utils/database.js';
import isNumber from '#utils/isNumber.js';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';
import randomId from '#utils/randomId.js';

/**
 * Retrieves one User by their ID or all Users if ID is not provided.
 * @param {number} id - optional - User ID to fetch a specific User or User group type.
 * @param {string} scope
 * @param {number} scope_id
 * @param {string} group - optional - Kind of group users to be fetched - currently available: employees, managers
 * @param {boolean} roles - optional - Should Roles be added to the output User
 * @param {boolean} managers - optional - Should Managers be added to the output User
 * @param {boolean} all_managers
 * @param {boolean} permissions
 * @param {boolean} managed_users - optional - Should Reportee Users be added to the output User
 * @param {boolean} all_managed_users
 * @param {boolean} removed - optional - default false - Should be removed Users included
 * @param {boolean} include_ppi - optional - Should PPI data be included
 * @param {boolean} include_configs - optional - Should User configurations be included
 * @returns {Promise<Object|Object[]|null>} User, array of Users, or null
 */
export async function getUser({id, scope, scope_id, group, roles=true, managers=true, all_managers=false,
                                  permissions=false, managed_users=true, all_managed_users=false,
                                  removed=false, include_ppi=false, include_configs=false} = {}) {

    const exclude = ['password', 'removed'];

    if (id != null)
        id = parseInt(id);

    if (scope_id != null)
        scope_id = parseInt(scope_id);

    if (!include_ppi)
        exclude.push('login', 'email', 'address', 'city', 'postal_code', 'phone', 'country');

    if (!include_configs)
        exclude.push('locale', 'theme_mode', 'manager_view_enabled', 'manager_nav_collapsed');

    async function extendUser(user, raw=false) {
        if (!user)
            return null;

        if (!raw)
            user = user.toJSON();

        delete user['UserRoles'];

        if (roles)
            user.roles = await getUserRoles({user: user.id});

        if (permissions)
            user.permissions = await fetchPermissions(user);

        if (managers || all_managers)
            user.managers = await getUserManagers({user: user.id, include_all_managers: all_managers});

        if (managed_users || all_managed_users)
            user.managed_users = await getUserManagers({manager: user.id, include_all_users: all_managed_users});

        return user;
    }

    async function fetchPermissions(user) {
        let roleIds;

        if (user.roles)
            roleIds = user.roles.map(r => r.id);
        else
            roleIds = (await getUserRoles({user: user.id})).map(r => r.id);

        const rolePermissions = (await getRolePermissions({role: roleIds})).map(p => p.name);
        const userPermissions = (await getUserPermissions({user: user.id})).map(p => p.name);

        return [...rolePermissions, ...userPermissions];
    }

    // Logic if the ID is provided - fetch a specific User
    if (isNumber(id) || (scope === 'user' && isNumber(scope_id))) {

        if (id == null && scope_id)
            id = scope_id;

        const user = await User.findOne({
            attributes: { exclude },
            where: { id, removed },
            raw: true
        });

        return await extendUser(user, true);
    }

    // Logic if no ID provided but there is a Scope specified

    if (scope && scope_id) {
        if (scope === 'manager')
            return await getUserManagers({manager: scope_id, include_all_users: true});

        else if (scope === 'team')
            return await getTeamUsers({team: scope_id, include_subteams: true});

        else if (scope === 'branch')
            return await getBranchUsers({branch: scope_id});

        else if (scope === 'project')
            return await getProjectUsers({project: scope_id});
    }

    // Logic if no ID nor Scopes are provided - fetch all Users
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

    if (!users?.length)
        return [];

    return await Promise.all(users.map(async user => await extendUser(user)));
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
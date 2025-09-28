// BACKEND/controller/users.js
import bcrypt from 'bcrypt';
import sequelize from '../db.js';
import User, {UserDetails, UserConfigs, UserRole, UserManager} from '../models/user.js';
import Role from '../models/role.js';
import { getUserRoles } from './roles.js';

/**
 * @typedef {Object} UserData
 * @property {number} id - User ID
 * @property {Object} UserDetails - Sequelize UserDetails association
 * @property {Object} UserConfigs - Sequelize UserConfigs association
 * @property {function} toJSON - Sequelize toJSON method
 */
/**
 * @typedef {Object} UserManager
 * @property {UserData} Manager - Sequelize User association
 * @property {UserData} User - Sequelize User association
 */

/**
 * Retrieves one user by their ID.
 * @param {number} id - User ID to fetch a specific user
 * @param {boolean} managers - Should managers be added to the output user
 * @param {boolean} roles - Should roles be added to the output user
 * @returns {Promise<Object|null>} Single user or null
 */
export async function getUser(id, managers=true, roles=true) {
    if (!id) return null;

    let user = await User.findOne({
        attributes: { exclude: ['password', 'removed'] },
        where: { id, removed: false },
        include: [
            { model: UserDetails,  as: 'UserDetails' },
            { model: UserConfigs,  as: 'UserConfigs' }
        ]
    });

    if (!user)
        return null;

    user = {
        ...user.toJSON(),
        ...user.UserDetails?.toJSON(),
        ...user.UserConfigs?.toJSON(),
    };

    delete user.user;
    delete user.UserDetails;
    delete user.UserConfigs;

    if (managers)
        user = {...user, managers: await getUserManagers(id)};

    if (roles)
        user = {...user, roles: await getUserRoles(id)};

    return user;
}
/**
 * Retrieves all users.
 * @returns {Promise<Object|Object[]|null>} Array of users or null
 */
export async function getUsers() {
    let users = await User.findAll({
        attributes: { exclude: ['password', 'removed'] },
        where: {removed: false },
        include: [
            { model: UserDetails,  as: 'UserDetails' }
        ],
        order: [['id', 'ASC']]
    });

    if (!users)
        return null;

    users = await Promise.all(users.map(async user => {
        const userData = {
            ...user.toJSON(),
            ...user.UserDetails.toJSON(),
            managers: await getUserManagers(user.id),
            roles: await getUserRoles(user.id)
        };
        delete userData.UserDetails;
        return userData;
    }));

    return users || null;
}

/**
 * Creates a new user.
 * @param {Object} data - User data
 * @param {string|null} data.login - User login
 * @param {string} data.email - User email
 * @param {string} data.password - User password
 * @param {string} data.first_name - First name
 * @param {string} data.last_name - Last name
 * @param {boolean} [data.manager_view_access=false] - Manager view access
 * @returns {Promise<{success: boolean, message: string, user?: Object}>}
 */
export async function createUser(data) {
    const transaction = await sequelize.transaction();
    try {
        if (!data.email || !data.first_name || !data.last_name) {
            return {success: false, message: 'Mandatory data not provided.'};
        }

        if (await User.findOne({where: {email: data.email}})) {
            return {success: false, message: 'Email must be unique.'};
        }

        if (data.login !== null && data.login !== undefined && await User.findOne({where: {login: data.login}})) {
            return {success: false, message: 'Login must be unique.'};
        }

        const hashedPassword = await bcrypt.hash(data.password || '1234', 10);

        const user = await User.create({
            login: data.login || null,
            email: data.email,
            password: hashedPassword,
            active: true,
            removed: false,
        }, { transaction });

        await UserDetails.create({
            user: user.id,
            first_name: data.first_name,
            last_name: data.last_name,
        }, { transaction });

        await UserConfigs.create({
            user: user.id,
            manager_view_access: data.manager_view_access || false,
            manager_view_enabled: false,
            manager_nav_collapsed: false
        }, { transaction });

        await transaction.commit();
        return {success: true, message: 'User created successfully.', user: user};
    } catch (err) {
        await transaction.rollback();
        return { success: false, message: `Error creating user: ${err.message}` }
    }

}

/**
 * Edits an existing user.
 * @param {number} userId - User ID
 * @param {Object} data - User data to update
 * @returns {Promise<{success: boolean, message: string, user?: Object}>}
 */
export async function editUser(userId, data) {
    if (!userId) {
        return {success: false, message: 'User ID not provided.'};
    }

    const user = await User.findOne({
        where: { id: userId, removed: false },
        include: [
            { model: UserDetails,  as: 'UserDetails' },
            { model: UserConfigs,  as: 'UserConfigs' },
        ],
    });

    if (!user) {
        return {success: false, message: 'User not found.'};
    }

    const userUpdate = {};

    if (data.login !== undefined) userUpdate.login = data.login;
    if (data.email) userUpdate.email = data.email;
    if (data.password) userUpdate.password = await bcrypt.hash(data.password, 10);
    if (data.active !== undefined) userUpdate.active = data.active;

    const updatedUser = await user.update(userUpdate);

    if (data.first_name || data.last_name) {
        await UserDetails.update(
            {
                first_name: data.first_name || user.UserDetails.first_name,
                last_name: data.last_name || user.UserDetails.last_name
            },
            { where: { user: userId } }
        );
    }

    await UserConfigs.update(
        {
            manager_view_enabled: user.UserConfigs.manager_view_enabled && data.manager_view_access,
            manager_view_access: data.manager_view_access,
        },
        { where: { user: userId } }
    );

    return {success: true, message: 'User updated successfully.', user: updatedUser};
}

/**
 * Removes user(s) by marking as removed and deleting details/configs.
 * @param {number|number[]} userIds - User ID or array of User IDs
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function removeUser(userIds) {
    if (!userIds || (Array.isArray(userIds) && userIds.length === 0)) {
        return { success: false, message: 'User ID(s) not provided.' };
    }

    const transaction = await sequelize.transaction();

    try {
        userIds = Array.isArray(userIds) ? userIds : [userIds];

        for (const id of userIds) {
            if (!Number.isInteger(id)) {
                await transaction.rollback();
                return { success: false, message: `Invalid user ID: ${id}` };
            }
        }

        const users = await User.findAll({
            where: { id: userIds, removed: false },
            transaction
        });

        if (users.length === 0) {
            await transaction.rollback();
            return { success: false, message: 'No users found or already removed.' };
        }

        if (users.length !== userIds.length) {
            await transaction.rollback();
            return { success: false, message: 'Some users were not found or already removed.' };
        }

        for (const user of users) {
            const userDetails = await UserDetails.findOne({
                where: { user: user.id },
                transaction
            });
            const userConfigs = await UserConfigs.findOne({
                where: { user: user.id },
                transaction
            });
            const userManagers = await UserManager.findOne({
                where: { user: user.id },
                transaction
            });
            const userRoles = await UserRole.findOne({
                where: { user: user.id },
                transaction
            });

            await user.update({
                active: false,
                removed: true
            }, { transaction });

            if (userDetails) {
                await userDetails.destroy({ transaction });
            }
            if (userConfigs) {
                await userConfigs.destroy({ transaction });
            }
            if (userManagers) {
                await userManagers.destroy({ transaction });
            }
            if (userRoles) {
                await userRoles.destroy({ transaction });
            }
        }

        await transaction.commit();
        return { success: true, message: `User${userIds.length > 1 ? 's' : ''} removed successfully.` };
    } catch (error) {
        await transaction.rollback();
        return { success: false, message: `Error removing user(s): ${error.message}` };
    }
}

/**
 * Retrieves all users with the 'Employee', 'Team Leader', or 'Specialist' role.
 * @returns {Promise<UserData[]>} Array of employees
 */
export async function getEmployees() {
    /**
     * @type {UserData[]}
     */
    let employees = await User.findAll({
        include: [
            {
                model: UserRole,
                required: true,
                include: [
                    {
                        model: Role,
                        where: { name: ['Employee', 'Team Leader', 'Specialist'] },
                        attributes: ['name']
                    }
                ],
                attributes: ['user', 'role']
            },
            {
                model: UserDetails,
                as: 'UserDetails',
                attributes: ['first_name', 'last_name']
            }
        ],
        where: { removed: false },
        attributes: { exclude: ['password', 'removed'] },
        order: [['id', 'ASC']]
    });

    employees = await Promise.all(employees.map(async e => {
        const userData = {
            ...e?.toJSON(),
            ...e.UserDetails?.toJSON(),
            roles: await getUserRoles(e.id),
            managers: await getUserManagers(e.id)
        };
        delete userData.UserDetails;
        return userData;
    }));

    return employees || [];
}

/**
 * Retrieves all users with the 'Manager' role.
 * @returns {Promise<UserData[]>} Array of managers
 */
export async function getManagers() {
    /**
     * @type {UserData[]}
     */
    let managers = await User.findAll({
        include: [
            {
                model: UserRole,
                required: true,
                include: [
                    {
                        model: Role,
                        where: { name: ['Manager', 'Branch Manager', 'Project Manager', 'CEO'] },
                        attributes: ['name']
                    }
                ],
                attributes: ['user', 'role']
            },
            {
                model: UserDetails,
                as: 'UserDetails',
                attributes: ['first_name', 'last_name']
            }
        ],
        where: { removed: false },
        attributes: { exclude: ['password', 'removed'] },
        order: [['id', 'ASC']]
    });

    managers = await Promise.all(managers.map(async m => {
        const userData = {
            ...m?.toJSON(),
            ...m.UserDetails?.toJSON(),
            roles: await getUserRoles(m.id),
            managers: await getUserManagers(m.id),
            managed_users: await getManagedUsers(m.id)
        };
        delete userData.UserDetails;
        return userData;
    }));

    return managers || [];
}

/**
 * Retrieves managers assigned to a specific user.
 * @param {number} userId - User ID
 * @returns {Promise<UserManager[]>} Array of managers assigned to the user
 */
export async function getUserManagers(userId) {
    if (!userId) {
        return [];
    }

    /**
     * @type {UserManager[]}
     */
    let managers = await UserManager.findAll({
        where: { user: userId },
        include: [
            {
                model: User,
                as: 'Manager',
                attributes: ['id'],
                include: [{ model: UserDetails, as: 'UserDetails' }]
            }
        ]
    });
    managers = managers.map(m => ({
        id: m.Manager.id,
        first_name: m.Manager.UserDetails?.first_name,
        last_name: m.Manager.UserDetails?.last_name
    }));

    return managers;
}

/**
* Updates Managers assigned to a User based on mode.
* - 'add': Appends managers to users if they don't exist yet
* - 'set': Sets provided managers to users and removes any other manager assignments
* - 'del': Removes provided managers from users if they have them
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
 * Retrieves users managed by a specific manager.
 * @param {number} managerId - Manager ID
 * @returns {Promise<UserManager[]>} Array of users managed by the manager
 */
export async function getManagedUsers(managerId) {
    if (!managerId) {
        return [];
    }

    /**
     * @type {UserManager[]}
     */
    let users = await UserManager.findAll({
        where: { manager: managerId },
        include: [
            {
                model: User,
                as: 'User',
                attributes: ['id'],
                include: [{ model: UserDetails, as: 'UserDetails' }]
            }
        ]
    });

    users = users.map(u => ({
        id: u?.User.id,
        first_name: u?.User.UserDetails?.first_name,
        last_name: u?.User.UserDetails?.last_name
    }));

    return users;
}

/**
 * Authenticates a user by login (ID, email, or login) and password.
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

    if (!user) {
        return { valid: false, status: 401, message: 'Invalid credentials, user not found!' };
    }

    if (!user.active || user.removed) {
        return { valid: false, status: 403, user: {id: user.id}, message: 'User inactive.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return { valid: false, status: 401, user: {id: user.id}, message: 'Invalid credentials!' };
    }

    user = await getUser(user.id);

    return { valid: true, user };
}

export async function hasManagerAccess(userId) {
    const userConfig = await UserConfigs.findOne(
        { where: { user: userId } }
    );

    return userConfig && userConfig.manager_view_access;
}

export async function hasManagerView(userId) {
    const userConfig = await UserConfigs.findOne(
        { where: { user: userId } }
    );

    return userConfig && userConfig.manager_view_enabled;
}

export async function setManagerView(userId, value) {
    const [updated] = await UserConfigs.update(
        { manager_view_enabled: value },
        { where: { user: userId } }
    );

    return updated === 1;
}

export async function toggleManagerNav(userId, value) {
    const [updated] = await UserConfigs.update(
        { manager_nav_collapsed: value },
        { where: { user: userId } }
    );

    return updated === 1;
}

/**
 * Sets theme of the user.
 * @param {number} user - User ID
 * @param {number} theme_mode - Theme mode - 0 for Dark, 1 for Light
 * @returns {Promise<boolean>}
 */
export async function setUserTheme(user, theme_mode) {
    if (!user) return null;

    const [updated] = await UserConfigs.update({ theme_mode }, { where: { user } });

    return updated === 1;
}
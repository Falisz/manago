// BACKEND/controller/users.js
import bcrypt from 'bcrypt';
import sequelize from '../utils/database.js';
import { User, UserManager, Role, UserRole } from '../models/users.js';
import { getUserRoles } from './roles.js';

/**
 * @typedef {Object} UserData
 * @property {number} id - User ID
 * @property {function} toJSON - Sequelize toJSON method
 */
/**
 * @typedef {Object} UserManager
 * @property {UserData} Manager - Sequelize User association
 * @property {UserData} User - Sequelize User association
 */

/**
 * Retrieves one user by their ID or all users if ID is not provided.
 * @param {number|string} id - optional - User ID to fetch a specific user or user group type.
 * @param {boolean} managers - optional - Should managers be added to the output user
 * @param {boolean} roles - optional - Should roles be added to the output user
 * @returns {Promise<Object|Object[]|null>} User, array of users or null
 */
export async function getUser(id, roles=true, managers=true, managed_users=false) {
    if (!id || isNaN(id)) {
        const where = { removed: false };

        if (id === 'all') {
            delete where.removed;
        } else if (id === 'employees') {
            where['$UserRoles.Role.name$'] = ['Employee', 'Team Leader', 'Specialist'];
        } else if (id === 'managers') {
            where['$UserRoles.Role.name$'] = ['Manager', 'Branch Manager', 'Project Manager', 'CEO'];
        }

        /**
         * @type {UserData[]}
         */
        let users = await User.findAll({
            attributes: { exclude: ['password', 'removed'] },
            where,
            order: [['id', 'ASC']]
        });

        if (!users)
            return null;

        users = await Promise.all(users.map(async user => {
            const userData = {
                ...user.toJSON(),
                ...(roles ? {roles: await getUserRoles(user.id)} : {}),
                ...(managers ? {managers: await getUserManagers(user.id)} : {}),
                ...(managed_users ? {managed_users: await getManagedUsers(user.id)} : {})
            };
            return userData;
        }));

        return users || null;
    }

    let user = await User.findOne({
        attributes: { exclude: ['password', 'removed'] },
        where: { id, removed: false }
    });

    if (!user)
        return null;

    user = user.toJSON();

    if (roles)
        user = {...user, roles: await getUserRoles(id)};

    if (managers)
        user = {...user, managers: await getUserManagers(id)};

    if (managed_users)
        user = {...user, managed_users: await getManagedUsers(id)};

    return user;
}

/**
 * Creates a new user.
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

        if (!data.id)
            while (true) {
                data.id = Math.floor(Math.random() * 900000) + 100000;
                if (!(await User.findOne({where: {id: data.id}})))
                    break;
            }

        const hashedPassword = await bcrypt.hash(data.password || '1234', 10);

        const user = await User.create({
            login: data.login || null,
            email: data.email,
            password: hashedPassword,
            active: true,
            removed: false,
            first_name: data.first_name,
            last_name: data.last_name,
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
 * Updates an existing user.
 * @param {number} userId - User ID
 * @param {Object} data - User data to update
 * @returns {Promise<{success: boolean, message: string, user?: Object}>}
 */
export async function updateUser(userId, data) {
    if (!userId) {
        return {success: false, message: 'User ID not provided.'};
    }

    const user = await User.findOne({
        where: { id: userId, removed: false }
    });

    if (!user) {
        return {success: false, message: 'User not found.'};
    }

    const userUpdate = {};

    if (data.login !== undefined && data.login !== user.login && 
        await User.findOne({ where: { login: data.login, id: { [sequelize.Op.ne]: userId } } }))
            return { success: false, message: 'Login must be unique.' };
    else 
        userUpdate.login = data.login;
    if (data.email && data.email !== user.email && 
        await User.findOne({ where: { email: data.email, id: { [sequelize.Op.ne]: userId } } })) 
            return { success: false, message: 'Email must be unique.' };
    else
        userUpdate.email = data.email;
    if (data.password) userUpdate.password = await bcrypt.hash(data.password, 10);
    if (data.active !== undefined) userUpdate.active = data.active;
    if (data.first_name) userUpdate.first_name = data.first_name;
    if (data.last_name) userUpdate.last_name = data.last_name;
    if (data.manager_view_access !== undefined) userUpdate.manager_view_access = data.manager_view_access;
    if (data.manager_view_enabled !== undefined) userUpdate.manager_view_enabled = data.manager_view_enabled;
    
    const updatedUser = await user.update(userUpdate);

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
                attributes: ['id', 'first_name', 'last_name']
            }
        ]
    });
    managers = managers.toJSON ? managers.toJSON() : managers;

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
                attributes: ['id', 'first_name', 'last_name']
            }
        ]
    });

    users = users.toJSON ? users.toJSON() : users;

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
    const user = await User.findOne({ where: { id: userId } });

    return user && user.manager_view_access;
}

export async function hasManagerView(userId) {
    const user = await User.findOne({ where: { id: userId } });

    return user && user.manager_view_enabled;
}

export async function setManagerView(userId, value) {
    const [updated] = await User.update({ manager_view_enabled: value }, { where: { id: userId } });

    return updated === 1;
}

export async function toggleManagerNav(userId, value) {
    const [updated] = await User.update({ manager_nav_collapsed: value }, { where: { id: userId } });

    return updated === 1;
}

/**
 * Sets theme of the user.
 * @param {number} userId - User ID
 * @param {number} theme_mode - Theme mode - 0 for Dark, 1 for Light
 * @returns {Promise<boolean>}
 */
export async function setUserTheme(userId, theme_mode) {
    if (!userId) return null;

    const [updated] = await User.update({ theme_mode }, { where: { id: userId } });

    return updated === 1;
}
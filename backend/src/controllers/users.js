// BACKEND/controller/users.js
import bcrypt from 'bcrypt';
import sequelize from '../utils/database.js';
import { User, UserManager, Role, UserRole } from '../models/users.js';
import { getUserRoles } from './roles.js';
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
    let user = await User.findOne({
        attributes: { exclude: ['password', 'removed'] },
        where: { id, removed: false }
    });

    if (!user)
        return null;

    user = user.toJSON ? user : user.toJSON();

    if (roles)
        user = {...user, roles: await getUserRoles({userId: id})};

    if (managers)
        user = {...user, managers: await getUserManagers({userId: id})};

    if (managed_users)
        user = {...user, managed_users: await getUserManagers({managerId: id})};

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
        id: randomId(User),
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
        await User.findOne({ where: { login: data.login, id: { [sequelize.Op.ne]: userId } } }))
            return { 
                success: false, 
                message: 'Login must be unique.' 
            };
            
    if (data.email && data.email !== user.email && 
        await User.findOne({ where: { email: data.email, id: { [sequelize.Op.ne]: userId } } })) 
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
            { where: { [sequelize.Op.or]: { user: id, manager: id} }, transaction }
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

    user = await getUser({id: user.id});

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
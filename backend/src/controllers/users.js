//BACKEND/controller/users.js
import bcrypt from 'bcrypt';
import sequelize from '../db.js';
import User, {UserDetails, UserConfigs, UserRole, UserManager} from '../models/user.js';
import Role from '../models/role.js';
import { getUserRoles } from './roles.js';

/**
 * Retrieves one or all users.
 * @param {number|null} userId - Optional user ID to fetch a specific user
 * @returns {Promise<Object|Object[]|null>} Single user, array of users, or null
 */
export async function getUsers(userId = null) {
    if (userId) {
        let user = await User.findOne({
            attributes: { exclude: ['password', 'removed'] },
            where: { ID: userId, removed: false },
            include: [
                { model: UserDetails,  as: 'UserDetails' },
                { model: UserConfigs,  as: 'UserConfigs' }
            ],
            order: [['ID', 'ASC']]
        });

        if (!user)
            return null;

        user = {
            ...user.toJSON(),
            ...user.UserDetails.toJSON(),
            ...user.UserConfigs.toJSON()
        };

        delete user.UserDetails;
        delete user.UserConfigs;

        return user;
    } else {
        let users = await User.findAll({
            attributes: { exclude: ['password', 'removed'] },
            where: {removed: false },
            include: [
                { model: UserDetails,  as: 'UserDetails' }
            ],
            order: [['ID', 'ASC']]
        });

        if (!users)
            return null;

        users = await Promise.all(users.map(async user => {
            const userData = {
                ...user.toJSON(),
                ...user.UserDetails.toJSON(),
                managers: await getUserManagers(user.ID),
                roles: await getUserRoles(user.ID)
            };
            delete userData.UserDetails;
            return userData;
        }));

        return users || null;
    }
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
    if (!data.email || !data.password || !data.first_name || !data.last_name) {
        return {success: false, message: "Mandatory data not provided."};
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await User.create({
        login: data.login || null,
        email: data.email,
        password: hashedPassword,
        active: true,
        removed: false,
    });

    await UserDetails.create({
        user: user.ID,
        first_name: data.first_name,
        last_name: data.last_name,
    });

    await UserConfigs.create({
        user: user.ID,
        manager_view_access: data.manager_view_access || false,
        manager_view_enabled: false,
        manager_nav_collapsed: false
    });

    return {success: true, message: "User created successfully.", user: user};
}

/**
 * Edits an existing user.
 * @param {number} userId - User ID
 * @param {Object} data - User data to update
 * @returns {Promise<{success: boolean, message: string, user?: Object}>}
 */
export async function editUser(userId, data) {
    if (!userId) {
        return {success: false, message: "User ID not provided."};
    }

    const user = await User.findOne({
        where: { ID: userId, removed: false },
        include: [
            { model: UserDetails,  as: 'UserDetails' },
            { model: UserConfigs,  as: 'UserConfigs' },
        ],
    });

    if (!user) {
        return {success: false, message: "User not found."};
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

    if (data.manager_view_access) {
        await UserConfigs.update(
            {
                manager_view_access: data.manager_view_access,
            },
            { where: { user: userId } }
        );
    }

    return {success: true, message: "User updated successfully.", user: updatedUser};
}

/**
 * Removes a user by marking as removed and deleting details/configs.
 * @param {number} userId - User ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function removeUser(userId) {
    const transaction = await sequelize.transaction();

    const user = await User.findOne({
        where: { ID: userId, removed: false },
        transaction
    });
    const userDetails = await UserDetails.findOne({
        where: { user: userId },
        transaction
    })
    const userConfigs = await UserConfigs.findOne({
        where: { user: userId },
        transaction
    })

    if (!user) {
        return {success: false, message: "User not found."};
    }

    await user.update({
        login: null,
        email: null,
        active: false,
        removed: true
    }, {transaction});

    if (userDetails) {
        await userDetails.destroy({ transaction });
    }

    if (userConfigs) {
        await userConfigs.destroy({ transaction });
    }

    await transaction.commit();

    return {success: true, message: "User removed successfully."};
}

/**
 * Retrieves managers assigned to a user.
 * @param {number} userId - User ID
 * @returns {Promise<Object[]|{success: boolean, message: string}>} Array of managers or error
 */
export async function getUserManagers(userId) {
    let managers;
    if (!userId) {
        managers = await User.findAll({
            include: [
                {
                    model: UserRole,
                    required: true,
                    include: [
                        {
                            model: Role,
                            where: {name: 'Manager'},
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
            where: {active: true},
            attributes: ['ID']
        });

        managers = managers?.map(m => ({
            ID: m.ID,
            first_name: m.UserDetails?.first_name,
            last_name: m.UserDetails?.last_name
        }));

        console.log('Retrieved managers:', managers);
    } else {
        managers = await UserManager.findAll({
            where: { user: userId },
            order: [['primary', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'Manager',
                    attributes: ['ID'],
                    include: [{ model: UserDetails, as: 'UserDetails' }]
                }
            ]
        });

        managers = managers.map(m => ({
            ID: m.Manager.ID,
            first_name: m.Manager.UserDetails?.first_name,
            last_name: m.Manager.UserDetails?.last_name,
            primary: m.primary
    }));
    }


    if (!managers || managers.length === 0) {
        return [];
    }

    return managers;
}

/**
 * Updates managers assigned to a user.
 * @param {number} userId - User ID
 * @param {Array<{manager: number, primary?: boolean}>} managerObjs - Array of manager objects
 * @returns {Promise<{success: boolean, message: string, status?: number}>}
 */
export async function updateUserManagers(userId, managerObjs) {
    if (!userId || isNaN(userId)) {
        return { success: false, message: "Invalid user ID provided.", status: 400 };
    }

    if (!Array.isArray(managerObjs) || managerObjs.some(m => isNaN(m.manager))) {
        return { success: false, message: "Invalid manager IDs provided. Must be an array of objects with manager IDs.", status: 400 };
    }

    const primaryManagers = managerObjs.filter(m => m.primary === true);
    if (primaryManagers.length > 1) {
        return { success: false, message: "User can have only one primary manager assigned.", status: 400 };
    }

    const managerIds = managerObjs.map(m => m.manager);

    const existingManagers = await User.findAll({
        where: { ID: managerIds },
        attributes: ['ID']
    });
    const existingManagerIds = existingManagers.map(u => u.ID);
    const invalidManagerIds = managerIds.filter(id => !existingManagerIds.includes(id));

    if (invalidManagerIds.length > 0) {
        return { success: false, message: `Invalid manager IDs: ${invalidManagerIds.join(', ')}`, status: 400 };
    }

    const transaction = await sequelize.transaction();

    try {
        await UserManager.destroy({
            where: { user: userId },
            transaction
        });

        await Promise.all(
            managerObjs.map(m =>
                UserManager.create(
                    {
                        user: userId,
                        manager: m.manager,
                        primary: m.primary === true
                    },
                    { transaction }
                )
            )
        );

        await transaction.commit();

        return { success: true, message: "User managers updated successfully." };
    } catch (err) {
        await transaction.rollback();
        return { success: false, message: "Failed to update user managers." };
    }
}
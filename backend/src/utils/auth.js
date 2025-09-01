//BACKEND/utils/auth.js
import bcrypt from 'bcrypt';
import User, {UserDetails, UserConfigs} from '../models/user.js';

/**
 * @typedef {Object} UserData
 * @property {Object} UserDetails - Sequelize UserDetails association
 * @property {Object} UserConfigs - Sequelize UserConfigs association
 * @property {string} password - User password
 * @property {boolean} active - User active status
 * @property {boolean} removed - User removed status
 * @property {function} toJSON - Sequelize toJSON method
 */

/**
 * Authenticates a user by login (ID, email, or login) and password.
 * @param {string|number} login - User ID, email, or login name
 * @param {string} password - User password
 * @returns {Promise<{ valid: boolean, status?: number, message?: string, user?: Object }>}
 */
export async function authUser(login, password) {
    const isInteger = Number.isInteger(Number(login));
    const isEmailFormat = typeof login === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login);

    const userData = await User.findOne({
        where: isInteger ? { id: login } : (isEmailFormat ? { email: login } : { login: login }),
        include: [
            { model: UserDetails, as: 'UserDetails' },
            { model: UserConfigs, as: 'UserConfigs' }
        ]
    });

    if (!userData) {
        return { valid: false, status: 401, message: 'Invalid credentials!' };
    }

    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
        return { valid: false, status: 401, user: {id: userData.id}, message: 'Invalid credentials, wrong password!' };
    }

    if (!userData.active || userData.removed) {
        return { valid: false, status: 403, user: {id: userData.id}, message: 'User inactive.' };
    }

    const user = {
        ...userData.toJSON(),
        ...userData.UserDetails.toJSON(),
        ...userData.UserConfigs.toJSON(),
    }
    delete user.password;
    delete user.UserDetails;
    delete user.UserConfigs;

    return { valid: true, user: user };
}

/**
 * Refreshes user data by ID.
 * @param {Object} user - User object with ID
 * @param {number} user.id - User ID
 * @returns {Promise<Object|null>}
 */
export async function refreshUser(user) {
    if (!user?.id) return null;

    const refreshedUser = await User.findOne({
        where: { id: user.id },
        include: [
            { model: UserDetails, as: 'UserDetails' },
            { model: UserConfigs, as: 'UserConfigs' }
        ]
    });

    if (!refreshedUser) return null;

    const result = {
        ...refreshedUser.toJSON(),
        ...refreshedUser.UserDetails.toJSON(),
        ...refreshedUser.UserConfigs.toJSON(),
    }
    delete result.password;
    delete result.UserDetails;
    delete result.UserConfigs;

    return result;
}

/**
 * Checks if a user is active.
 * @param {Object} user - User object with ID
 * @param {number} user.id - User ID
 * @returns {Promise<boolean>}
 */
export async function checkUserAccess(user) {
    const result = await User.findOne({
        attributes: ['active'],
        where: { id: user.id }
    });

    return result ? result.active : false;
}

/**
 * Checks if a user has manager view access.
 * @param {Object} user - User object with ID
 * @param {number} user.id - User ID
 * @returns {Promise<boolean>}
 */
export async function checkManagerAccess(user) {
    const result = await UserConfigs.findOne({
        where: { user: user.id }
    });

    return result ? result.manager_view_access : false;
}
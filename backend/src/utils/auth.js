//BACKEND/controller/auth.js
const {User, UserDetails, UserConfigs} = require("../db");
const bcrypt = require("bcrypt");

async function authUser(login, password) {
    const isInteger = Number.isInteger(Number(login));
    const isEmailFormat = typeof login === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login);

    const userData = await User.findOne({
        where: isInteger ? { ID: login } : (isEmailFormat ? { email: login } : { login: login }),
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
        return { valid: false, status: 401, message: 'Invalid credentials, wrong password!' };
    }

    if (!userData.active || userData.removed) {
        return { valid: false, status: 403, message: 'User inactive.' };
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

async function refreshUser(user) {
    if (!user?.ID) return null;

    const refreshedUser = await User.findOne({
        where: { ID: user.ID },
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

async function checkUserAccess(user) {
    const result = await User.findOne({
        attributes: ['active'],
        where: { ID: user.ID }
    });

    return result ? result.active : false;
}

async function checkManagerAccess(user) {
    const result = await UserConfigs.findOne({
        where: { user: user.ID }
    });

    return result ? result.manager_view_access : false;
}

module.exports = {
    authUser,
    refreshUser,
    checkUserAccess,
    checkManagerAccess,
};
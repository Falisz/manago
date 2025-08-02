//BACKEND/controller/users.js
const { User, UserDetails, UserConfigs, sequelize} = require('../db')

const bcrypt = require('bcrypt');

async function getUsers(userId = null) {
    if (userId) {
        let user = await User.findOne({
            attributes: { exclude: ['password', 'removed'] },
            where: { ID: userId, removed: false },
            include: [
                { model: UserDetails,  as: 'UserDetails' }
            ],
            order: [['ID', 'ASC']]
        });

        if (!user)
            return null;

        user = {
            ...user.toJSON(),
            ...user.UserDetails.toJSON()
        };

        delete user.UserDetails;

        return user;
    } else {
        const users = await User.findAll({
            attributes: { exclude: ['password', 'removed'] },
            where: {removed: false },
            include: [
                { model: UserDetails,  as: 'UserDetails' }
            ],
            order: [['ID', 'ASC']]
        });

        if (!users)
            return null;

        return users.map(user => {
            const userData = {
                ...user.toJSON(),
                ...user.UserDetails.toJSON()
            };
            delete userData.UserDetails;
            return userData;
        }) || null;
    }
}

async function createUser(data) {
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

async function editUser(userId, data) {
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

async function removeUser(userId) {
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

module.exports = {
    getUsers,
    createUser,
    editUser,
    removeUser
};
//BACKEND/controller/roles.js
const {  Role, sequelize, UserRole } = require('../db')

async function getRoles(roleId = null) {
    if (roleId) {

        let role = await Role.findOne({
            where: { ID: roleId },
        });

        if (!role) {
            return null
        }

        role = {
            ...role.toJSON(),
        }

        return role;

    } else {

        const roles = await Role.findAll({order: [['power', 'ASC']]});

        return roles.map(role => {
            return {
                ...role.toJSON(),
            };
        }) || null;

    }
}

async function getUserRoles(userId) {
    if (!userId) {
        return {success: false, message: "User ID not provided."};
    }

    const roles = await UserRole.findAll({
        attributes: {exclude: ['id']},
        where: { user: userId },
        order: [['role', 'ASC']],
        include: [
            { model: Role }
        ],
    });

    return roles.map(role => {
        role = {
            ...role.Role.toJSON(),
        };
        delete role.Role;
        return role;
    }) || null;

}

async function createRole(data) {

    if (!data.name || !data.power) {
        return {success: false, message: "Mandatory data not provided."};
    }

    if (await Role.findOne({where: {name: data.name}})) {
        return {success: false, message: "The role with this exact name already exists."};
    }

    const role = await Role.create({
        name: data.name || null,
        power: data.power,
        system_default: false,
    });


    return {success: true, message: "Role created successfully.", role: role};

}

async function updateRole(roleId, data) {
    if (!roleId) {
        return {success: false, message: "Role ID not provided."};
    }

    const role = await Role.findOne({
        where: { ID: roleId },
    });

    if (!role) {
        return {success: false, message: "Role not found."};
    }

    const roleUpdate = {};

    if (data.name) roleUpdate.name = data.name;
    if (data.power) roleUpdate.power = data.power;
    if (data.system_default) roleUpdate.system_default = data.system_default;

    const updatedRole = await role.update(roleUpdate);

    return {success: true, message: "Role updated successfully.", role: updatedRole};
}

async function deleteRole(roleId) {
    if (!roleId) {
        return {success: false, message: "Role ID not provided."};
    }

    const transaction = await sequelize.transaction();

    const role = await Role.findOne({
        where: { ID: roleId },
        transaction
    });

    if (!role) {
        await transaction.rollback();
        return { success: false, message: "Role not found or already removed." };
    }

    const roleAssignments = await UserRole.findAll({
        where: {role: roleId},
        transaction
    });

    await Promise.all(
        roleAssignments.map(assignment => assignment.destroy({ transaction }))
    );

    await role.destroy({ transaction });

    await transaction.commit();
    return { success: true, message: "Role removed successfully." };
}

async function updateUserRoles(userId, roleIds) {
    if (!userId || isNaN(userId)) {
        return { success: false, message: "Invalid user ID provided.", status: 400 };
    }

    if (!Array.isArray(roleIds) || roleIds.some(id => isNaN(id))) {
        return { success: false, message: "Invalid role IDs provided. Must be an array of integers.", status: 400 };
    }

    const transaction = await sequelize.transaction();

    const existingRoles = await Role.findAll({
        where: { ID: roleIds },
        attributes: ['ID'],
        transaction
    });

    const existingRoleIds = existingRoles.map(role => role.ID);
    const invalidRoleIds = roleIds.filter(id => !existingRoleIds.includes(id));

    if (invalidRoleIds.length > 0) {
        await transaction.rollback();
        return { success: false, message: `Invalid role IDs: ${invalidRoleIds.join(', ')}`, status: 400 };
    }

    const currentUserRoles = await UserRole.findAll({
        where: { user: userId },
        attributes: ['role'],
        transaction
    });

    const currentRoleIds = currentUserRoles.map(ur => ur.role);

    const rolesToAdd = roleIds.filter(id => !currentRoleIds.includes(id));
    const rolesToRemove = currentRoleIds.filter(id => !roleIds.includes(id));

    await Promise.all(
        rolesToAdd.map(roleId =>
            UserRole.create({ user: userId, role: roleId }, { transaction })
        )
    );

    await UserRole.destroy({
        where: {
            user: userId,
            role: rolesToRemove
        },
        transaction
    });

    await transaction.commit();
    return { success: true, message: "User roles updated successfully." };
}

module.exports = {
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    getUserRoles,
    updateUserRoles,
};
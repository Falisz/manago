//BACKEND/controller/roles.js
const {  Role, sequelize, UserRole} = require('../db')

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

        const roles = await Role.findAll({order: [['ID', 'ASC']]});

        if (!roles)
            return null;

        return roles.map(role => {
            return {
                ...role.toJSON(),
            };
        }) || null;

    }
}

async function createRole(data) {

    if (!data.name || !data.power) {
        return {success: false, message: "Mandatory data not provided."};
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
        where: { ID: roleId, removed: false },
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
        where: { ID: roleId, removed: false },
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

module.exports = {
    getRoles,
    createRole,
    updateRole,
    deleteRole,
};
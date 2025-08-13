import sequelize from "../db.js";
import {DataTypes} from "sequelize";

export const Role = sequelize.define('Role', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    power: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        allowNull: false,
    },
    system_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true
    }
}, {
    tableName: 'roles',
    timestamps: false
});

export default Role;
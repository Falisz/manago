import sequelize from "../db.js";
import {DataTypes} from "sequelize";

export const Role = sequelize.define('Role', {
    id: {
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
    description: {
        type: DataTypes.TEXT,
        allowNull: true
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
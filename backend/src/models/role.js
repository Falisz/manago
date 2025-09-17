import sequelize from "../db.js";
import {DataTypes} from "sequelize";

export const Role = sequelize.define('Role', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    icon: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    system_default: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    }
}, {
    tableName: 'roles',
    timestamps: false
});

export default Role;
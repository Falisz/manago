// BACKEND/models/Role.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

export const Role = sequelize.define('Role', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    icon: DataTypes.STRING,
    description: DataTypes.TEXT,
    system_default: DataTypes.BOOLEAN
}, {
    tableName: 'roles',
    timestamps: false
});
export default Role;

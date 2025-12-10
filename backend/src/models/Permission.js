// BACKEND/models/Permission.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';

export const Permission = sequelize.define('Permission', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    desc: DataTypes.STRING
}, {
    tableName: 'permissions',
    timestamps: false
});
export default Permission;
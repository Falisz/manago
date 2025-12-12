// BACKEND/models/Permission.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

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
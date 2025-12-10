// BACKEND/models/UserPermission.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import User from './User.js';
import Permission from './Permission.js';

export const UserPermission = sequelize.define('UserPermission', {
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    permission: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Permission, key: 'id' }
    }
}, {
    tableName: 'user_permissions',
    timestamps: false,
    indexes: [{ unique: true, fields: ['user', 'permission'] }],
    noPrimaryKey: true
});
export default UserPermission;
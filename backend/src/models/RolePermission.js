// BACKEND/models/RolePermission.js
import {DataTypes} from 'sequelize';
import Role from './Role.js';
import Permission from './Permission.js';
import sequelize from '#utils/database.js';

export const RolePermission = sequelize.define('RolePermission', {
    role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Role, key: 'id' }
    },
    permission: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Permission, key: 'id' }
    }
}, {
    tableName: 'role_permissions',
    timestamps: false,
    indexes: [{ unique: true, fields: ['role', 'permission'] }],
    noPrimaryKey: true
});
export default RolePermission;
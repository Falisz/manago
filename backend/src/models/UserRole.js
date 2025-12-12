// BACKEND/models/UserRole.js
import {DataTypes} from 'sequelize';
import User from './User.js';
import Role from './Role.js';
import sequelize from '#utils/database.js';

export const UserRole = sequelize.define('UserRole', {
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Role, key: 'id' }
    }
}, {
    tableName: 'user_roles',
    timestamps: false,
    indexes: [{ unique: true, fields: ['user', 'role'] }],
    noPrimaryKey: true
});
export default UserRole;

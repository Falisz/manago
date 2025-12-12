// BACKEND/models/UserManager.js
import {DataTypes} from 'sequelize';
import User from './User.js';
import sequelize from '#utils/database.js';

export const UserManager = sequelize.define('UserManager', {
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    manager: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    }
}, {
    tableName: 'user_managers',
    timestamps: false,
    indexes: [{ unique: true, fields: ['user', 'manager'] }],
    noPrimaryKey: true
});
export default UserManager;
// BACKEND/models/BranchUser.js
import {DataTypes} from 'sequelize';
import Branch from './Branch.js';
import BranchRole from './BranchRole.js';
import User from './User.js';
import sequelize from '#utils/database.js';

export const BranchUser = sequelize.define('BranchUser', {
    branch: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Branch, key: 'id' }
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: BranchRole, key: 'id' },
    }
}, {
    tableName: 'branch_users',
    timestamps: false,
    indexes: [{ unique: true, fields: ['branch', 'user'] }],
    noPrimaryKey: true
});

export default BranchUser;
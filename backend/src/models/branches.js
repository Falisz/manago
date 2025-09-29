// BACKEND/models/branches.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import {User} from './users.js';

export const Branch = sequelize.define('Branch', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'branches',
    timestamps: false
});

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
    }
}, {
    tableName: 'branch_users',
    timestamps: false,
    indexes: [{ unique: true, fields: ['branch', 'user'] }],
    noPrimaryKey: true
});

//
// Model Associations for branches.js
//
// Branch <-> BranchUser
Branch.hasMany(BranchUser, { foreignKey: 'branch', sourceKey: 'id' });
BranchUser.belongsTo(Branch, { foreignKey: 'branch', targetKey: 'id' });
//
// User <-> BranchUser
User.hasMany(BranchUser, { foreignKey: 'user', sourceKey: 'id' });
BranchUser.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });
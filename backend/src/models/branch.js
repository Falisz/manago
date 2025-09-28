import {DataTypes} from "sequelize";
import sequelize from "../db.js";
import User from "./user.js";
import Project from "./project.js";

export const Branch = sequelize.define('Branch', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(100),
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
        references: { model: 'branches', key: 'id' }
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    }
}, {
    tableName: 'branch_users',
    timestamps: false,
    indexes: [{ unique: true, fields: ['branch', 'user'] }]
});

Project.hasMany(BranchUser, { foreignKey: 'branch', sourceKey: 'id' });
BranchUser.belongsTo(Project, { foreignKey: 'branch', targetKey: 'id' });
User.hasMany(BranchUser, { foreignKey: 'user', sourceKey: 'id' });
BranchUser.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });

export default Branch;
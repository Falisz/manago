// BACKEND/models/BranchRole.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

export const BranchRole = sequelize.define('BranchRole', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'branch_roles',
    timestamps: false
});

export default BranchRole;
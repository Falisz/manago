// BACKEND/models/Labor.js
import {DataTypes} from 'sequelize';
import LaborStatus from './LaborStatus.js';
import LaborType from './LaborType.js';
import Project from './Project.js';
import User from './User.js';
import sequelize from '#utils/database.js';

export const Labor = sequelize.define('Labor', {
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id', as: 'User' }
    },
    time: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    project: {
        type: DataTypes.INTEGER,
        references: { model: Project, key: 'id' }
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: LaborType, key: 'id' }
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: LaborStatus, key: 'id' }
    },
    approver: {
        type: DataTypes.INTEGER,
        references: { model: User, key: 'id', as: 'Approver' }
    }
}, {
    tableName: 'time_records',
    timestamps: true
});
export default Labor;
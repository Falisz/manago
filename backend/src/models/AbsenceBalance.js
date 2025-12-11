// BACKEND/models/AbsenceBalance.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import LeaveType from './LeaveType.js';
import User from "./User.js";

export const AbsenceBalance = sequelize.define('AbsenceBalance', {
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {model: User, key: 'id'}
    },
    type: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {model: LeaveType, key: 'id'}
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    totalBalance: DataTypes.INTEGER,
    usedBalance: DataTypes.INTEGER,
    availableBalance: DataTypes.INTEGER,
    collectedDates: DataTypes.JSON,
    compensatedDates: DataTypes.JSON,
    availableDates: DataTypes.JSON
}, {
    tableName: 'absence_balance',
    timestamps: false,
    indexes: [{ unique: true, fields: ['user', 'type', 'year'] }],
    noPrimaryKey: true
});
export default AbsenceBalance;
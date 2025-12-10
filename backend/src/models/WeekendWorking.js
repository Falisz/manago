// BACKEND/models/WeekendWorking.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import RequestStatus from './RequestStatus.js';
import User from './User.js';

export const WeekendWorking = sequelize.define('WeekendWorking', {
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: RequestStatus, key: 'id' }
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    approver: {
        type: DataTypes.INTEGER,
        references: { model: User, key: 'id' }
    },
    user_note: DataTypes.TEXT,
    approver_note: DataTypes.TEXT
}, {
    tableName: 'weekend_workings',
    timestamps: false,
    indexes: [{ unique: true, fields: ['user', 'date'] }]
});
export default WeekendWorking;

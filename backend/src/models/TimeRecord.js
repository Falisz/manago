// BACKEND/models/TimeRecord.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import TimeRecordStatus from './TimeRecordStatus.js';

export const TimeRecord = sequelize.define('TimeRecord', {
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    time: {
        type: DataTypes.NUMBER,
        allowNull: false
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: TimeRecordStatus, key: 'id' }
    },
    approver: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' }
    }
}, {
    tableName: 'time_records',
    timestamps: true
});
export default TimeRecord;
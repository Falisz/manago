// BACKEND/models/TimeRecordStatus.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';

export const TimeRecordStatus = sequelize.define('TimeRecordStatus', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'time_record_statuses',
    timestamps: false
});
export default TimeRecordStatus;
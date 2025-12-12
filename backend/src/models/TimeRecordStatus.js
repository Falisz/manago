// BACKEND/models/TimeRecordStatus.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

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
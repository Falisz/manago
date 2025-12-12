// BACKEND/models/HolidayWorking.js
import {DataTypes} from 'sequelize';
import Holiday from './Holiday.js';
import RequestStatus from './RequestStatus.js';
import User from './User.js';
import sequelize from '#utils/database.js';

export const HolidayWorking = sequelize.define('HolidayWorking', {
    holiday: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Holiday, key: 'id' }
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
    tableName: 'holiday_workings',
    timestamps: false,
    indexes: [{ unique: true, fields: ['holiday', 'user'] }]
});
export default HolidayWorking;

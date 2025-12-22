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
    date_created: DataTypes.DATE,
    date_requested: DataTypes.DATE,
    date_approved: DataTypes.DATE,
    date_rejected: DataTypes.DATE,
    date_cancelled: DataTypes.DATE,
    user_note: DataTypes.TEXT,
    approver_note: DataTypes.TEXT
}, {
    tableName: 'holiday_workings',
    timestamps: false,
    indexes: [{ unique: true, fields: ['holiday', 'user'] }]
});
export default HolidayWorking;

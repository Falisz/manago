// BACKEND/models/Absence.js
import {DataTypes} from 'sequelize';
import AbsenceType from './AbsenceType.js';
import RequestStatus from './RequestStatus.js';
import User from './User.js';
import sequelize from '#utils/database.js';

export const Absence = sequelize.define('Absence', {
    type: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: AbsenceType, key: 'id' }
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    end_date: DataTypes.DATEONLY,
    days: DataTypes.INTEGER,
    include_weekends: DataTypes.BOOLEAN,
    include_holidays: DataTypes.BOOLEAN,
    date_created: DataTypes.DATE,
    date_requested: DataTypes.DATE,
    date_approved: DataTypes.DATE,
    date_rejected: DataTypes.DATE,
    date_cancelled: DataTypes.DATE,
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
    user_note: DataTypes.TEXT,
    approver: {
        type: DataTypes.INTEGER,
        references: { model: User, key: 'id' }
    },
    approver_note: DataTypes.TEXT
}, {
    tableName: 'absences',
    timestamps: false
});
export default Absence;
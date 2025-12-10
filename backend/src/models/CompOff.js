// BACKEND/models/CompOff.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import RequestStatus from './RequestStatus.js';
import User from './User.js';

export const CompOff = sequelize.define('CompOff', {
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
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
    tableName: 'comp_offs',
    timestamps: false
});
export default CompOff;

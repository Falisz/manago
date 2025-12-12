// BACKEND/models/TimeRecord.js
import {DataTypes} from 'sequelize';
import Project from './Project.js';
import User from './User.js';
import TimeRecordStatus from './TimeRecordStatus.js';
import sequelize from '#utils/database.js';

export const TimeRecord = sequelize.define('TimeRecord', {
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    time: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    project: {
        type: DataTypes.INTEGER,
        references: { model: Project, key: 'id' }
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id', as: 'User' }
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: TimeRecordStatus, key: 'id' }
    },
    approver: {
        type: DataTypes.INTEGER,
        references: { model: User, key: 'id', as: 'Approver' }
    }
}, {
    tableName: 'time_records',
    timestamps: true
});
export default TimeRecord;
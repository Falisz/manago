// BACKEND/models/Shift.js
import {DataTypes} from 'sequelize';
import User from './User.js';
import JobPost from './JobPost.js';
import JobLocation from './JobLocation.js';
import Schedule from './Schedule.js';
import sequelize from '#utils/database.js';

export const Shift = sequelize.define('Shift', {
    user: {
        type: DataTypes.INTEGER,
        references: { model: User, key: 'id' }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    start_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    end_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    job_post: {
        type: DataTypes.INTEGER,
        references: { model: JobPost, key: 'id' }
    },
    job_location: {
        type: DataTypes.INTEGER,
        references: { model: JobLocation, key: 'id' }
    },
    schedule: {
        type: DataTypes.INTEGER,
        references: { model: Schedule, key: 'id' }
    },
    note: DataTypes.TEXT,
}, {
    tableName: 'shifts',
    timestamps: false
});
export default Shift;
// BACKEND/models/Schedule.js
import {DataTypes} from 'sequelize';
import User from './User.js';
import sequelize from '#utils/database.js';

export const Schedule = sequelize.define('Schedule', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: DataTypes.TEXT,
    user_scope: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_scope_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    author: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
}, {
    tableName: 'schedules'
});
export default Schedule;
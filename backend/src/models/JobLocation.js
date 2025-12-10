// BACKEND/models/JobLocation.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';

export const JobLocation = sequelize.define('JobLocation', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: DataTypes.TEXT,
    color: DataTypes.STRING(7)
}, {
    tableName: 'job_locations',
    timestamps: false
});
export default JobLocation;

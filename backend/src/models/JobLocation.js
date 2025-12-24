// BACKEND/models/JobLocation.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

export const JobLocation = sequelize.define('JobLocation', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    abbreviation: DataTypes.STRING,
    description: DataTypes.TEXT,
    color: DataTypes.STRING(7)
}, {
    tableName: 'job_locations',
    timestamps: false
});
export default JobLocation;

// BACKEND/models/Project.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

export const Project = sequelize.define('Project', {
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: DataTypes.TEXT,
    startDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate: DataTypes.DATE,
    data: DataTypes.JSON
}, {
    tableName: 'projects',
    timestamps: false
});
export default Project;
// BACKEND/models/Project.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

export const Project = sequelize.define('Project', {
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: DataTypes.TEXT,
    start_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end_date: DataTypes.DATE,
    data: DataTypes.JSON
}, {
    tableName: 'projects',
    timestamps: false
});
export default Project;
// BACKEND/models/Project.js
import {DataTypes} from 'sequelize';
import User from './User.js';
import sequelize from '#utils/database.js';

export const Project = sequelize.define('Project', {
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    manager: {
        type: DataTypes.INTEGER,
        references: { model: User, key: 'id' }
    },
    description: DataTypes.TEXT,
    startDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate: DataTypes.DATE,
    data: DataTypes.JSON,
}, {
    tableName: 'projects',
    timestamps: false
});
export default Project;
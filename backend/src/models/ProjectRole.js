// BACKEND/models/ProjectRole.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

export const ProjectRole = sequelize.define('ProjectRole', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'project_roles',
    timestamps: false
})
export default ProjectRole;
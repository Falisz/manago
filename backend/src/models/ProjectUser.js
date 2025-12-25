// BACKEND/models/ProjectUser.js
import {DataTypes} from 'sequelize';
import User from './User.js';
import Project from './Project.js';
import ProjectRole from './ProjectRole.js';
import sequelize from '#utils/database.js';

export const ProjectUser = sequelize.define('ProjectUser', {
    project: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Project, key: 'id' }
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    role: {
        type: DataTypes.INTEGER,
        references: { model: ProjectRole, key: 'id' }
    }
}, {
    tableName: 'project_users',
    timestamps: false,
    indexes: [{ unique: true, fields: ['project', 'user'] }],
    noPrimaryKey: true
});
export default ProjectUser;
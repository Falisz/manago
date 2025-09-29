// BACKEND/models/projects.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import {User} from './users.js';

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
    endDate: DataTypes.DATE
}, {
    tableName: 'projects',
    timestamps: false
});

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
    }
}, {
    tableName: 'project_users',
    timestamps: false,
    indexes: [{ unique: true, fields: ['project', 'user'] }],
    noPrimaryKey: true
});

//
// Model Associations for projects.js
//
// User <-> Project (manager)
User.hasMany(Project, { foreignKey: 'manager', sourceKey: 'id', as: 'ManagedProjects' });
Project.belongsTo(User, { foreignKey: 'manager', targetKey: 'id', as: 'Manager' });
//
// Project <-> ProjectUser
Project.hasMany(ProjectUser, { foreignKey: 'project', sourceKey: 'id' });
ProjectUser.belongsTo(Project, { foreignKey: 'project', targetKey: 'id' });
//
// User <-> ProjectUser
User.hasMany(ProjectUser, { foreignKey: 'user', sourceKey: 'id' });
ProjectUser.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });
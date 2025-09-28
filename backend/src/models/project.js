import sequelize from "../db.js";
import {DataTypes} from "sequelize";
import User from "./user.js";

export const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    manager: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'projects',
    timestamps: false
});

export const ProjectUser = sequelize.define('ProjectUser', {
    project: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'projects', key: 'id' }
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    }
}, {
    tableName: 'project_users',
    timestamps: false,
    indexes: [{ unique: true, fields: ['project', 'user'] }]
});

Project.hasMany(ProjectUser, { foreignKey: 'project', sourceKey: 'id' });
ProjectUser.belongsTo(Project, { foreignKey: 'project', targetKey: 'id' });
User.hasMany(ProjectUser, { foreignKey: 'user', sourceKey: 'id' });
ProjectUser.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });

export default Project;
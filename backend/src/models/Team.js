// BACKEND/models/Team.js
import {DataTypes} from 'sequelize';
import Branch from './Branch.js';
import Project from './Project.js';
import sequelize from '#utils/database.js';

export const Team = sequelize.define('Team', {
    name: DataTypes.STRING,
    code_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    parent_team: {
        type: DataTypes.INTEGER,
        references: { model: 'teams', key: 'id' }
    },
    branch: {
        type: DataTypes.INTEGER,
        references: { model: Branch, key: 'id' }
    },
    project: {
        type: DataTypes.INTEGER,
        references: { model: Project, key: 'id' }
    },
    ms_teams: DataTypes.TEXT
}, {
    tableName: 'teams',
    timestamps: false
});
export default Team;
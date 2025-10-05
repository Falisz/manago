// BACKEND/models/teams.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import {User} from './users.js';
import {Branch} from "./branches.js";
import {Project} from "./projects.js";

export const Team = sequelize.define('Team', {
    name: DataTypes.STRING,
    code_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    parent_team: {
        type: DataTypes.INTEGER,
        references: { model: 'Team', key: 'id' }
    },
    branch: {
        type: DataTypes.INTEGER,
        references: { model: 'Branch', key: 'id' }
    },
    project: {
        type: DataTypes.INTEGER,
        references: { model: 'Project', key: 'id' }
    },
    ms_teams: DataTypes.TEXT
}, {
    tableName: 'teams',
    timestamps: false
});

export const TeamRole = sequelize.define('TeamRole', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'team_roles',
    timestamps: false
})

export const TeamUser = sequelize.define('TeamUser', {
    team: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Team, key: 'id' }
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: TeamRole, key: 'id' },
    }
}, {
    tableName: 'team_users',
    timestamps: false,
    indexes: [{ unique: true, fields: ['team', 'user'] }],
    noPrimaryKey: true
});

//
// Model Associations for teams.js
//
// Team <-> Team (optional, self-referential parent-child)
Team.hasMany(Team, { foreignKey: 'parent_team', as: 'ChildTeams' });
Team.belongsTo(Team, { foreignKey: 'parent_team', as: 'ParentTeam' });
//
// Team <-> Project (optional)
Project.hasMany(Team, { foreignKey: 'project', sourceKey: 'id' });
Team.belongsTo(Project, { foreignKey: 'project', targetKey: 'id' });
//
// Team <-> Branch (optional)
Branch.hasMany(Team, { foreignKey: 'branch', sourceKey: 'id' });
Team.belongsTo(Branch, { foreignKey: 'branch', targetKey: 'id' });
//
// Team <-> TeamUser
Team.hasMany(TeamUser, { foreignKey: 'team', sourceKey: 'id' });
TeamUser.belongsTo(Team, { foreignKey: 'team', targetKey: 'id' });
//
// User <-> TeamUser
User.hasMany(TeamUser, { foreignKey: 'user', sourceKey: 'id' });
TeamUser.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });
//
// TeamRole <-> TeamUser
TeamRole.hasMany(TeamUser, { foreignKey: 'role', sourceKey: 'id' });
TeamUser.belongsTo(TeamRole, { foreignKey: 'role', targetKey: 'id' });
import sequelize from "../db.js";
import {DataTypes} from "sequelize";
import User from "./user.js";

export const Team = sequelize.define('Team', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    parent_team: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    code_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    ms_teams: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
}, {
    tableName: 'teams',
    timestamps: false
});

export const TeamUser = sequelize.define('TeamUser', {
    team: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'teams', key: 'id' }
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0 // 0 - member, 1 - leader, 2 - manager
    }
}, {
    tableName: 'team_users',
    timestamps: false,
    indexes: [{ unique: true, fields: ['team', 'user'] }]
});

Team.hasMany(TeamUser, { foreignKey: 'team', sourceKey: 'id' });
TeamUser.belongsTo(Team, { foreignKey: 'team', targetKey: 'id' });
User.hasMany(TeamUser, { foreignKey: 'user', sourceKey: 'id' });
TeamUser.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });

export default Team;
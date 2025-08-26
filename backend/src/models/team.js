import sequelize from "../db.js";
import {DataTypes} from "sequelize";
import User from "./user.js";

export const Team = sequelize.define('Team', {
    ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    project: {
        type: DataTypes.INTEGER,
        allowNull: true
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
    }
}, {
    tableName: 'teams',
    timestamps: false
});

export const TeamUser = sequelize.define('TeamUser', {
    team: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'teams', key: 'ID' }
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'ID' }
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

Team.hasMany(TeamUser, { foreignKey: 'team', sourceKey: 'ID' });
TeamUser.belongsTo(Team, { foreignKey: 'team', targetKey: 'ID' });
User.hasMany(TeamUser, { foreignKey: 'user', sourceKey: 'ID' });
TeamUser.belongsTo(User, { foreignKey: 'user', targetKey: 'ID' });

export default Team;
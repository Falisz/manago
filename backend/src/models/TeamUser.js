// BACKEND/models/TeamUser.js
import {DataTypes} from 'sequelize';
import Team from './Team.js';
import TeamRole from './TeamRole.js';
import User from './User.js';
import sequelize from '#utils/database.js';

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
        references: { model: TeamRole, key: 'id' }
    }
}, {
    tableName: 'team_users',
    timestamps: false,
    indexes: [{ unique: true, fields: ['team', 'user'] }],
    noPrimaryKey: true
});
export default TeamUser;
// BACKEND/models/Channel.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import Branch from './Branch.js';
import Project from './Project.js';
import Team from './Team.js';
import Role from './Role.js';

export const Channel = sequelize.define('Channel', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    branch: {
        type: DataTypes.INTEGER,
        references: { model: Branch, key: 'id' }
    },
    project: {
        type: DataTypes.INTEGER,
        references: { model: Project, key: 'id' }
    },
    team: {
        type: DataTypes.INTEGER,
        references: { model: Team, key: 'id' }
    },
    role: {
        type: DataTypes.INTEGER,
        references: { model: Role, key: 'id' }
    },
    channel: DataTypes.INTEGER
}, {
    tableName: 'channels',
    timestamps: false
});
export default Channel;
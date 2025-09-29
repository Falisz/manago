// BACKEND/models/posts.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import {User, Role} from './users.js';
import {Branch} from "./branches.js";
import {Project} from "./projects.js";
import {Team} from "./teams.js";

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

export const Post = sequelize.define('Post', {
    channel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Channel, key: 'id' }
    },
    author: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    title: DataTypes.STRING,
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, { tableName: 'posts' });

//
// Model Associations for posts.js
//
// Branch <-> Channel
Branch.hasMany(Channel, { foreignKey: 'branch', sourceKey: 'id' });
Channel.belongsTo(Branch, { foreignKey: 'branch', targetKey: 'id' });
//
// Project <-> Channel
Project.hasMany(Channel, { foreignKey: 'project', sourceKey: 'id' });
Channel.belongsTo(Project, { foreignKey: 'project', targetKey: 'id' });
//
// Team <-> Channel
Team.hasMany(Channel, { foreignKey: 'team', sourceKey: 'id' });
Channel.belongsTo(Team, { foreignKey: 'team', targetKey: 'id' });
//
// Role <-> Channel
Role.hasMany(Channel, { foreignKey: 'role', sourceKey: 'id' });
Channel.belongsTo(Role, { foreignKey: 'role', targetKey: 'id' });
//
// Channel <-> Channel (self-referential)
Channel.hasMany(Channel, { foreignKey: 'channel', sourceKey: 'id', as: 'ChildChannels' });
Channel.belongsTo(Channel, { foreignKey: 'channel', targetKey: 'id', as: 'ParentChannel' });
//
// User <-> Post (author)
User.hasMany(Post, { foreignKey: 'author', sourceKey: 'id', as: 'Posts' });
Post.belongsTo(User, { foreignKey: 'author', targetKey: 'id', as: 'Author' });
//
// Channel <-> Post
Channel.hasMany(Post, { foreignKey: 'channel', sourceKey: 'id' });
Post.belongsTo(Channel, { foreignKey: 'channel', targetKey: 'id' });
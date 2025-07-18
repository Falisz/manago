const {DataTypes, Sequelize} = require("sequelize");
const {sequelize} = require('../db');
const {User} = require('user-models');

const Channel = sequelize.define('Channel', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: 'channels',
    timestamps: false
});

const Post = sequelize.define('Post', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    channelID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    authorID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    isEdited: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'posts',
    timestamps: false
});

Channel.hasMany(Post, { foreignKey: 'channelID', sourceKey: 'ID' });
Post.belongsTo(Channel, { foreignKey: 'channelID', targetKey: 'ID' });

User.hasMany(Post, { foreignKey: 'authorID', sourceKey: 'ID' });
Post.belongsTo(User, { foreignKey: 'authorID', targetKey: 'ID' });

module.exports = {Post, Channel};
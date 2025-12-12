// BACKEND/models/Post.js
import {DataTypes} from 'sequelize';
import Channel from './Channel.js';
import User from './User.js';
import sequelize from '#utils/database.js';

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
}, {
    tableName: 'posts'
});
export default Post;
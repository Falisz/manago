import {DataTypes, Sequelize} from "sequelize";
import sequelize from "../db.js";
import User from "./user.js";

export const Post = sequelize.define('Post', {
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

User.hasMany(Post, { foreignKey: 'authorID', sourceKey: 'ID' });
Post.belongsTo(User, { foreignKey: 'authorID', targetKey: 'ID' });

export default Post;
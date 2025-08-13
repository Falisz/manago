import Post from "./post.js";
import sequelize from "../db.js";
import {DataTypes} from "sequelize";

export const Channel = sequelize.define('Channel', {
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

Channel.hasMany(Post, { foreignKey: 'channelID', sourceKey: 'ID' });
Post.belongsTo(Channel, { foreignKey: 'channelID', targetKey: 'ID' });

export default Channel;
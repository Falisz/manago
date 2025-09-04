import Post from "./post.js";
import sequelize from "../db.js";
import {DataTypes} from "sequelize";

export const Channel = sequelize.define('Channel', {
    id: {
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

Channel.hasMany(Post, { foreignKey: 'channel', sourceKey: 'id' });
Post.belongsTo(Channel, { foreignKey: 'channel', targetKey: 'id' });

export default Channel;
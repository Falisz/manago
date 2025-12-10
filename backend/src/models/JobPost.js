// BACKEND/models/JobPost.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';

export const JobPost = sequelize.define('JobPost', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    color: DataTypes.STRING(7)
}, {
    tableName: 'job_posts',
    timestamps: false
});
export default JobPost;
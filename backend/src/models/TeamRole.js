// BACKEND/models/TeamRole.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';

export const TeamRole = sequelize.define('TeamRole', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'team_roles',
    timestamps: false
})
export default TeamRole;
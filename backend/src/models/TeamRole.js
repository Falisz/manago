// BACKEND/models/TeamRole.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

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
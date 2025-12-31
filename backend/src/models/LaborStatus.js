// BACKEND/models/LaborStatus.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

export const LaborStatus = sequelize.define('LaborStatus', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'labor_statuses',
    timestamps: false
});
export default LaborStatus;
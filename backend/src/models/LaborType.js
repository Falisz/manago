// BACKEND/models/LaborType.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

export const LaborType = sequelize.define('LaborType', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'labor_types',
    timestamps: false
});
export default LaborType;
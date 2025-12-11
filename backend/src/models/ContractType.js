// BACKEND/models/ContractType.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';

export const ContractType = sequelize.define('ContractType', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: DataTypes.TEXT,
    hours_per_week: DataTypes.INTEGER,
    hours_per_day: DataTypes.INTEGER,
    work_mode: DataTypes.INTEGER // 0 - office, 1 - remote, 2 - hybrid, 3 - field
}, {
    tableName: 'contracts_types',
    timestamps: false
});
export default ContractType;
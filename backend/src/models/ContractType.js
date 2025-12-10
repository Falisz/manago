// BACKEND/models/ContractType.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';

export const ContractType = sequelize.define('ContractType', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: DataTypes.TEXT
}, {
    tableName: 'contracts_types',
    timestamps: false
});
export default ContractType;
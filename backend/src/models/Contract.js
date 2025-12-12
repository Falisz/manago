// BACKEND/models/Contract.js
import {DataTypes} from 'sequelize';
import User from './User.js';
import ContractType from './ContractType.js';
import sequelize from '#utils/database.js';

export const Contract = sequelize.define('Contract', {
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    type: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: ContractType, key: 'id' }
    },
    start_date: DataTypes.DATEONLY,
    end_date: DataTypes.DATEONLY,
    parent_contract: {
        type: DataTypes.INTEGER,
        references: { model: 'contracts', key: 'id' }
    },
    hours_per_week: DataTypes.INTEGER,
    hours_per_day: DataTypes.INTEGER,
    notes: DataTypes.TEXT,
    file: DataTypes.STRING
}, {
    tableName: 'contracts',
    timestamps: false
});
export default Contract;
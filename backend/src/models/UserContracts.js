// BACKEND/models/UserContracts.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import User from './User.js';
import ContractType from './ContractType.js';

export const UserContracts = sequelize.define('UserContract', {
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    contract: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: ContractType, key: 'id' }
    },
    start_date: DataTypes.DATEONLY,
    end_date: DataTypes.DATEONLY,
    parent_contract: {
        type: DataTypes.INTEGER,
        references: { model: 'user_contracts', key: 'id' }
    },
    hours_per_week: DataTypes.INTEGER,
    hours_per_day: DataTypes.INTEGER,
    notes: DataTypes.TEXT,
    file: DataTypes.STRING
}, {
    tableName: 'user_contracts',
    timestamps: false
});
export default UserContracts;
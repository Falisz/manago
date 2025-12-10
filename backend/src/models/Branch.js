// BACKEND/models/Branch.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';

export const Branch = sequelize.define('Branch', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: DataTypes.STRING,
    active: DataTypes.BOOLEAN,
    location: DataTypes.STRING,
    founding_date: DataTypes.DATE,
    data: DataTypes.JSON,
}, {
    tableName: 'branches',
    timestamps: false
});

export default Branch;
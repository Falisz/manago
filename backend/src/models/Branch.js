// BACKEND/models/Branch.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

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
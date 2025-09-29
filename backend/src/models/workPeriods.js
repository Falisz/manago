// BACKEND/models/week.js
import sequelize from '../db.js';
import {DataTypes} from 'sequelize';

export const Quarter = sequelize.define('Quarter', {
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    }
}, {
    tableName: 'quarters',
    timestamps: false,
});

export const Week = sequelize.define('Week', {
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    }
}, {
    tableName: 'weeks',
    timestamps: false,
});
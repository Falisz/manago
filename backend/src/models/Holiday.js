// BACKEND/models/Holiday.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

export const Holiday = sequelize.define('Holiday', {
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    requestable_working: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'holidays',
    timestamps: false
});
export default Holiday;
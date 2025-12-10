// BACKEND/models/DispositionPreset.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';

// OFF: 00:00 - 00:00, FULL: 00:00 - 23:59, MS: 06:00 - 15:00, AS: 15:00 - 23:59
export const DispositionPreset = sequelize.define('DispositionPreset', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    start_time: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    end_time: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    color: DataTypes.STRING(7)
}, {
    tableName: 'disposition_presets',
    timestamps: false,
});
export default DispositionPreset;
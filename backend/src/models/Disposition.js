// BACKEND/models/Disposition.js
import {DataTypes} from 'sequelize';
import DispositionPreset from './DispositionPreset.js';
import sequelize from '#utils/database.js';

export const Disposition = sequelize.define('Disposition', {
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    start_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    end_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    preset: {
        type: DataTypes.INTEGER,
        references: { model: DispositionPreset, key: 'id' }
    },
    notes: DataTypes.TEXT
}, {
    tableName: 'dispositions',
    timestamps: false
});
export default Disposition;
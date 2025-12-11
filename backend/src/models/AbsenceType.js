// BACKEND/models/AbsenceType.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';

export const AbsenceType = sequelize.define('AbsenceType', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    parent_type: {
        type: DataTypes.INTEGER,
        references: { model: 'absence_types', key: 'id' }
    },
    amount: DataTypes.INTEGER,           // number of days of the leave in one year
    multiple: DataTypes.BOOLEAN,         // flag if more than one day of the leave can be applied on the request
    scaled: DataTypes.BOOLEAN,           // flag if the number should be scaled to the number of months worked in one year
    transferable: DataTypes.BOOLEAN,     // flag if the remaining amount can be transferred to the next year
    ref_required: DataTypes.BOOLEAN,     // flag if the referral number is required
    file_required: DataTypes.BOOLEAN,    // flag if the referral document is required
    color: DataTypes.STRING
}, {
    tableName: 'absence_types',
    timestamps: false
});
export default AbsenceType;
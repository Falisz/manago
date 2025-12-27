// BACKEND/models/AbsenceType.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

export const AbsenceType = sequelize.define('AbsenceType', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    abbreviation: DataTypes.STRING,
    parent_type: {
        type: DataTypes.INTEGER,
        references: { model: 'absence_types', key: 'id' }
    },
    multiple: DataTypes.BOOLEAN,         // flag if more than one day of the leave can be applied on the request
    plannable: DataTypes.BOOLEAN,        // flag if it can be saved as Planned or can be only requested
    amount: DataTypes.INTEGER,           // number of days of the leave in one year
    scaled: DataTypes.BOOLEAN,           // flag if the number should be scaled to the number of months worked in one year
    transferable: {                      // for how many years can the balance be transferred to be be used
        type: DataTypes.INTEGER,
        default: 0
    },
    ref_required: DataTypes.BOOLEAN,     // flag if the referral number is required
    file_required: DataTypes.BOOLEAN,    // flag if the referral document is required
    color: DataTypes.STRING
}, {
    tableName: 'absence_types',
    timestamps: false
});
export default AbsenceType;
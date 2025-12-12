// BACKEND/models/RequestStatus.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

export const RequestStatus = sequelize.define('RequestStatus', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'request_statuses',
    timestamps: false
});
export default RequestStatus;
// BACKEND/models/RequestStatus.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';

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
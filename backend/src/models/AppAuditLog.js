// BACKEND/models/AppAuditLog.js
import {DataTypes} from 'sequelize';
import User from './User.js';
import sequelize from '#utils/database.js';

export const AppAuditLog = sequelize.define('AuditLog', {
    user: {
        type: DataTypes.INTEGER,
        references: { model: User, key: 'id' }
    },
    action: DataTypes.STRING,
    result: DataTypes.STRING,
    old_value: DataTypes.STRING,
    new_value: DataTypes.STRING,
}, {
    tableName: 'app_audit_logs'
});
export default AppAuditLog;
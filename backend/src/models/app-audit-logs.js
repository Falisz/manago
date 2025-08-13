import sequelize from "../db.js";
import {DataTypes} from "sequelize";

export const AppAuditLogs = sequelize.define('AuditLogs', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    timestamp: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: ''
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    action: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: ''
    },
    old_value: {
        type: DataTypes.STRING(150),
        allowNull: false,
        defaultValue: ''
    },
    new_value: {
        type: DataTypes.STRING(150),
        allowNull: false,
        defaultValue: ''
    },
}, {
    tableName: 'app_audit_logs',
    timestamps: false
});

export default AppAuditLogs;
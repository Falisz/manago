import sequelize from "../db.js";
import {DataTypes} from "sequelize";

export const AppAuditLogs = sequelize.define('AuditLogs', {
    id: {
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
    result: {
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

export const AppSecurityLogs = sequelize.define('AppSecurityLogs', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    org: {
        type: DataTypes.STRING(250),
        allowNull: false,
        defaultValue: ''
    },
    action: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: ''
    },
    message: {
        type: DataTypes.STRING(150),
        allowNull: false,
        defaultValue: ''
    }
}, {
    tableName: 'app_security_logs',
    timestamps: false
});

export default AppAuditLogs;
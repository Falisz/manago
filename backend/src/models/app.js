// BACKEND/models/appResources.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import {User} from "./users.js";

export const AppModule = sequelize.define('AppModules', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    icon: DataTypes.STRING,
    description: DataTypes.TEXT,
    enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'app_modules',
    timestamps: false
});

export const AppConfig = sequelize.define('AppConfig', {
    configName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    selectedOption: {
        type: DataTypes.STRING,
        allowNull: false
    },
    module: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {model: AppModule, key: 'id'}
    },
    options: {
        type: DataTypes.JSON,
        allowNull: false
    }
}, {
    tableName: 'app_configs',
    timestamps: false
});

export const AppPage = sequelize.define('AppPages', {
    view: {
        type: DataTypes.STRING,
        allowNull: false
    },
    pages: {
        type: DataTypes.JSON,
        allowNull: false
    }
}, {
    tableName: 'app_pages',
    timestamps: false
})

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

export const AppSecurityLog = sequelize.define('AppSecurityLog', {
    user: {
        type: DataTypes.INTEGER,
        references: { model: User, key: 'id' }
    },
    org: DataTypes.STRING,
    action: DataTypes.STRING,
    message: DataTypes.STRING
}, {
    tableName: 'app_security_logs'
});

//
// Model Associations for appResources.js
//
// AppModule <-> AppConfig
AppModule.hasMany(AppConfig, { foreignKey: 'module', sourceKey: 'id', as: 'AuditLogs' });
AppConfig.belongsTo(AppModule, { foreignKey: 'module', targetKey: 'id', as: 'User' });
//
// User <-> AppAuditLog
User.hasMany(AppAuditLog, { foreignKey: 'user', sourceKey: 'id', as: 'AuditLogs' });
AppAuditLog.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });
//
// User <-> AppSecurityLog
User.hasMany(AppSecurityLog, { foreignKey: 'user', sourceKey: 'id', as: 'SecurityLogs' });
AppSecurityLog.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });
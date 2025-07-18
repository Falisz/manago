const {DataTypes} = require("sequelize");
const {sequelize} = require('../db');

const AppModule = sequelize.define('Modules', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        defaultValue: 0
    },
    title: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: ''
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'app_modules',
    timestamps: false
});

const AppPage = sequelize.define('Pages', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    view: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    module: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    parent: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },
    path: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: ''
    },
    icon: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: ''
    },
    component: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: ''
    },
    min_power: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 10
    }
}, {
    tableName: 'app_pages',
    timestamps: false
});

const AppAuditLogs = sequelize.define('AuditLogs', {
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

AppPage.belongsTo(AppPage, { foreignKey: 'parent', targetKey: 'ID' });
AppPage.belongsTo(AppModule, { foreignKey: 'module', targetKey: 'ID' });
AppModule.hasMany(AppPage, { foreignKey: 'module', sourceKey: 'ID' });

module.exports = {AppModule, AppPage, AppAuditLogs};
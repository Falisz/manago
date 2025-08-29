import {DataTypes} from "sequelize";
import sequelize from "../db.js";
import AppModule from "./app-module.js";

export const AppPage = sequelize.define('Pages', {
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
    }
}, {
    tableName: 'app_pages',
    timestamps: false
});

AppPage.belongsTo(AppPage, { foreignKey: 'parent', targetKey: 'ID' });
AppPage.belongsTo(AppModule, { foreignKey: 'module', targetKey: 'ID' });
AppModule.hasMany(AppPage, { foreignKey: 'module', sourceKey: 'ID' });

export default AppPage;
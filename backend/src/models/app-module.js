import sequelize from "../db.js";
import {DataTypes} from "sequelize";

export const AppModule = sequelize.define('Modules', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
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

export default AppModule;
import sequelize from "../db.js";
import {DataTypes} from "sequelize";

export const AppModule = sequelize.define('Modules', {
    id: {
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
    icon: {
        type: DataTypes.STRING(50),
        allowNull: true,
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
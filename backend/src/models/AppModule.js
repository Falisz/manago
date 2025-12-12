// BACKEND/models/AppModule.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

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
export default AppModule;
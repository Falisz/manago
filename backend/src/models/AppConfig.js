// BACKEND/models/AppConfig.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import AppModule from './AppModule.js';

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
export default AppConfig;
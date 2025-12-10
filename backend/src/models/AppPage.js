// BACKEND/models/AppPages.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';

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
});

export default AppPage;
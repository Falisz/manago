// BACKEND/models/AppPages.js
import {DataTypes} from 'sequelize';
import sequelize from '#utils/database.js';

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
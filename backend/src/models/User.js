// BACKEND/models/User.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';

export const User = sequelize.define('User', {
    login: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        unique: true
    },
    address: DataTypes.STRING,
    city: DataTypes.STRING,
    postal_code: DataTypes.STRING,
    country: DataTypes.STRING,
    phone: DataTypes.STRING,
    avatar: DataTypes.STRING,
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    joined: DataTypes.DATEONLY,             // Date of joining the company
    notice_period: DataTypes.INTEGER,       // Number of days before notice period expires
    notice_start: DataTypes.DATEONLY,       // Date of notice period start
    left: DataTypes.DATEONLY,               // Date of leaving the company
    last_login_attempt: DataTypes.DATE,
    last_login: DataTypes.DATE,
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    removed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    locale: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'en'
    },
    theme_mode: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'dark'
    },
    manager_view_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    manager_nav_collapsed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'users',
    timestamps: false
});
export default User;
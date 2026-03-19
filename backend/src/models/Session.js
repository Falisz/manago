// BACKEND/models/Session.js
import { DataTypes } from 'sequelize';
import sequelize from '#utils/database.js';

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    token: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    ipAddress: DataTypes.STRING,
    userAgent: DataTypes.STRING
}, {
    tableName: 'user_sessions'
});

export default Session;
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import {User} from './User.js';

export const AppSecurityLog = sequelize.define('AppSecurityLog', {
    user: {
        type: DataTypes.INTEGER,
        references: { model: User, key: 'id' }
    },
    org: DataTypes.STRING,
    action: DataTypes.STRING,
    message: DataTypes.STRING
}, {
    tableName: 'app_security_logs'
});

export default AppSecurityLog;
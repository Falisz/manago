// BACKEND/utils/database.js
import Sequelize from 'sequelize';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

/**
 * Sequelize instance for database connection
 * @type {Sequelize}
 */
export const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USERNAME || 'appagent',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'staff_portal',
    logging: false
});

export default sequelize;
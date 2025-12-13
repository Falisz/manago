// BACKEND/index.js
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import '#utils/dotenv.js';
import apiRouter from '#api';
import sequelize from '#utils/database.js';
import { requestLoggerHandler, errorLoggerHandler } from '#utils/logger.js';
import { getCorsConfig } from '#utils/corsConfig.js';
import { INFO, ERROR, WARN } from '#utils/consoleColors.js';

// Environment variables
const PORT = process.env.PORT || 5000;

// App and Middleware initialization.
const app = express();
app.use(cookieParser());
app.use(cors(getCorsConfig()));
app.use(express.json());
app.use(requestLoggerHandler);
app.use(apiRouter);
app.use(errorLoggerHandler);

/**
 * Starts the Express server and initializes the database.
 * @returns {Promise<void>}
 */
async function startServer() {
    console.log(INFO + ' Starting the server...');

    try {
        await sequelize.authenticate();
    } catch (err) {
        new Error(ERROR + ' Database authentication failed: ' + err.message);
    }
    try {
        await sequelize.sync();
    } catch (err) {
        new Error(ERROR + ' Database model sync failed: ' + err.message);
    }

    console.log(INFO + ' Database connection established. Data models synced successfully.');

    app.listen(PORT, () => {
        console.log(INFO + ' Server is up and running on port ' + PORT);
        console.log(WARN + ' This backend build still in development stage.');
    });
}

startServer().catch(err => {
    console.error(ERROR + 'Failed to start server:', err);
    process.exit(1);
});
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
import { globalLimiter } from '#utils/rateLimit.js';
import checkSessionStoreHandler from "#middleware/checkSessionStoreHandler.js";

// Environment variables
const PORT = process.env.PORT || 5000;

// App initialization
const app = express();

// Rate Limiter
app.set('trust proxy', 1);
app.use(globalLimiter);

// Cookie Parser and COORS
app.use(cookieParser());
app.use(cors(getCorsConfig()));
app.use(express.json());

// Request Logger
app.use(requestLoggerHandler);

// Session Store Handler
app.use(checkSessionStoreHandler);

// Request Router
app.use(apiRouter);

// Error Logger
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
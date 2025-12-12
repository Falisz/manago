// BACKEND/index.js
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './utils/database.js';
import seedData from './utils/seedData.js';
import apiRouter from './api/index.js';
import { requestLoggerHandler, errorLoggerHandler } from './utils/logger.js';
import { waitForKeypress } from './utils/keypress.js';
import { validateEnv } from './utils/validateEnv.js';
import { getCorsConfig } from './utils/corsConfig.js';
import { INFO, ERROR, WARN } from './utils/consoleColors.js';

// Environment variables and validation.
dotenv.config();
validateEnv();
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

        console.log(INFO + ' Database connection established. Data models and stores synced successfully.');

        if (process.stdin.isTTY) {
            console.log(INFO + ' Press \'space\' key within next two seconds to seed data...');
            const key = await waitForKeypress('space', 2000);
            if (key) {
                await seedData();
            } else {
                console.log('\n' + INFO + ' Data seeding skipped.');
            }
        } else {
            console.log(INFO + ' Backend script is being run without interactive terminal. Skipping data seeding.');
        }

        console.log(WARN + ' This backend build still in development stage.');

        app.listen(PORT, () => {
            console.log(INFO + ' Server is up and running on port ' + PORT);
        });
    } catch (err) {
        console.error(ERROR + ' Failed to start server:', err);
        process.exit(1);
    }
}

startServer().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});
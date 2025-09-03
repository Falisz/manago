//BACKEND/index.js
import express from 'express';
import session from 'express-session';
import SequelizeStore from 'connect-session-sequelize';
import cors from 'cors';
import winston from 'winston';
import dotenv from 'dotenv';
import sequelize from './db.js';
import seedData from './utils/seed-data.js';
import appRoutes from './api/app.js';
import authRoutes from './api/auth.js';
import usersRoutes from './api/users.js';
import rolesRoutes from './api/roles.js';
import teamsRoutes from './api/teams.js';
import postsRoutes from './api/posts.js';
import readline from 'readline';

dotenv.config();

/**
 * Waits for a specific keypress within a timeout period.
 * @param {string} keyToDetect - The key to detect (e.g., 'space')
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<string|null>} The detected key name or null if timeout occurs
 */
function waitForKeypress(keyToDetect, timeout) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    return new Promise((resolve) => {
        let keyPressed = false;

        const timeoutId = setTimeout(() => {
            if (!keyPressed) {
                process.stdin.setRawMode(false); 
                process.stdin.pause();
                rl.close();
                resolve(null); 
            }
        }, timeout);

        process.stdin.on('keypress', (char, key) => {
            if (key && key.name === keyToDetect) {
                keyPressed = true;
                clearTimeout(timeoutId);
                process.stdin.setRawMode(false);
                process.stdin.pause();
                rl.close();
                resolve(key.name);
            }
        });
    });
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ filename: 'requests.log' })
    ]
});

const validateEnv = () => {
    const requiredEnvVars = [
        'SESSION_SECRET',
        'PORT',
        'DB_DIALECT',
        'DB_HOST',
        'DB_PORT',
        'DB_NAME',
        'DB_USERNAME',
        'DB_PASSWORD'
    ];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
};

validateEnv();

const app = express();

const SequelizeStoreClass = SequelizeStore(session.Store);
const store = new SequelizeStoreClass({
    db: sequelize,
    tableName: 'sessions',
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 7 * 24 * 60 * 60 * 1000
});

app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false
}));

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    store: store,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));

app.use((req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown IP';
    const host = req.headers.host || 'Unknown Host';
    const referer = req.headers.referer || req.get('referer') || 'No Referer';

    logger.info(`Incoming ${req.method} request ${req.url} from: {IP:${ip} Host:${host} Referer:${referer}}`);
    next();
});

app.use('/', appRoutes);
app.use('/', authRoutes);
app.use('/users', usersRoutes);
app.use('/roles', rolesRoutes);
app.use('/teams', teamsRoutes);
app.use('/posts', postsRoutes);

const errorHandler = (err, req, res, _next) => {
    console.error('❌ Server error:\n', err.stack);
    res.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const INFO = `\x1b[1;34m[INFO]\x1b[0m`;
const ERROR = `\x1b[31m[ERROR]\x1b[0m`;
const WARN = `\x1b[1;33m[WARN]\x1b[0m`;

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
        try {
            await store.sync();
        } catch (err) {
            new Error(ERROR + ' Session store sync failed: ' + err.message);
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
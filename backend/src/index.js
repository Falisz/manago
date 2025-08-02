//BACKEND/index.js
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const cors = require('cors');
const winston = require('winston');
const dotenv = require('dotenv');
dotenv.config();
const { sequelize } = require('./db');
const { seedData } = require('./utils/seed-data');

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

const store = new SequelizeStore({
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

app.use('/', require('./api/utils'));
app.use('/', require('./api/auth'));
app.use('/users', require('./api/users'));
app.use('/posts', require('./api/posts'));

const errorHandler = (err, req, res, _next) => {
    console.error('❌ Server error:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);

async function startServer() {
    console.log('🔄️ Starting the server...');

    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        await sequelize.sync();
        console.log('✅ Database models synced successfully');

        await store.sync();
        console.log('✅ Session store synced successfully');

        console.log('🔄️ Starting data seeding...');
        await seedData();
        console.log('✅ Data seeding completed');

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`🚀 Server is up and running on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

startServer().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});
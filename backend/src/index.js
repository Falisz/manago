//BACKEND/index.js
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const { sequelize } = require('./db');


const validateEnv = () => {
    const requiredEnvVars = ['SESSION_SECRET', 'PORT'];
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
    origin: ['http://localhost:3000', 'http://localhost:3001'],
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
        domain: 'localhost',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));

app.use((req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown IP';
    const host = req.headers.host || 'Unknown Host';
    const referer = req.headers.referer || req.get('referer') || 'No Referer';
    const origin = req.headers.origin || 'No Origin';
    const userAgent = req.headers['user-agent'] || 'Unknown User-Agent';

    console.log(`Incoming request: ${req.method} ${req.url}`);
    console.log('Request Origin:');
    console.log(`  IP: ${ip}`);
    console.log(`  Host: ${host}`);
    console.log(`  Referer: ${referer}`);
    console.log(`  Origin: ${origin}`);
    console.log(`  User-Agent: ${userAgent}`);

    if (req.cookies) {
        console.log('Cookies:', req.cookies);
    }
    next();
});

app.use('/api/staff', require('./staff'));
app.use('/api/manager', require('./manager'));

const errorHandler = (err, req, res, _next) => {
    console.error('❌ Server error:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('✅  Database connection established');

        await store.sync();
        console.log('✅  Session store synced successfully');

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`🚀 Server is up and running on port ${PORT}`);
        });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

startServer().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});
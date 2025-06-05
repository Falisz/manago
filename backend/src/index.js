const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { Sequelize } = require('sequelize');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Configure Sequelize for SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './sessions.sqlite'
});

// Configure session store
const store = new SequelizeStore({
    db: sequelize,
    tableName: 'Sessions'
});

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false
}));

// Log incoming requests for debugging
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url} from ${req.headers.origin}`);
    console.log('Cookies:', req.cookies);
    console.log('Session ID:', req.sessionID);
    next();
});

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    store: store,
    resave: false,
    saveUninitialized: false,
    cookie: {
        domain: 'localhost',
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));

// store.sync().catch(err => console.error('Session store sync error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/manager', require('./routes/manager'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
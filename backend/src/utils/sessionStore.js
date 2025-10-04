// BACKEND/utils/sessionStore.js
import session from 'express-session';
import SequelizeStore from 'connect-session-sequelize';
import sequelize from './database.js';

/**
 * Creates and configures the session store
 * @returns {SequelizeStore} Configured session store instance
 * @returns {function} .sync - Syncs the session store with the database
 */
export function createSessionStore() {
    const SequelizeStoreClass = SequelizeStore(session.Store);
    return new SequelizeStoreClass({
        db: sequelize,
        tableName: 'sessions',
        checkExpirationInterval: 15 * 60 * 1000,
        expiration: 7 * 24 * 60 * 60 * 1000
    });
}

/**
 * Returns session configuration options
 * @param {SequelizeStore} store - The session store instance
 * @returns {Object} Session configuration
 */
export function getSessionConfig(store) {
    return {
        secret: process.env.SESSION_SECRET,
        store: store,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'lax'
        }
    };
}

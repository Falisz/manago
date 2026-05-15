// BACKEND/utils/rateLimit.js
import { rateLimit } from 'express-rate-limit';
import { WARN } from './consoleColors.js';

// General limiter to all the requests
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    limit: 100000, // 100000 requests tops within the above time window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
    handler: (req, res, next, options) => {
        console.log(`${WARN} Rate limit exceeded for IP: ${req.ip}`);
        res.status(options.statusCode).send(options.message);
    }
});

// Login limiter for Brute-force
export const authLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 min
    limit: 10, // 10 login-attempts
    message: { message: 'Too many login attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// BACKEND/utils/logger.js
import winston from 'winston';

/**
 * Logger instance for logging requests and errors.
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, stack }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}${stack ? '\n' + stack : ''}`;
        })
    ),
    transports: [
        new winston.transports.File({
            filename: 'logs/requests.log',
            level: 'warn',
            format: winston.format((info) => {
                return info.level === 'error' ? false : info;
            })()
        }),
        new winston.transports.File({
            filename: 'logs/errors.log',
            level: 'error'
        })
    ]
});

/**
 * Handler for logging incoming requests.
 * @param req
 * @param res
 * @param next
 */
export const requestLoggerHandler = (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown IP';
    const host = req.headers.host || 'Unknown Host';
    const referer = req.headers.referer || req.get('referer') || 'No Referer';

    logger.info(`Incoming ${req.method} request ${req.url} from: {IP:${ip} Host:${host} Referer:${referer}}`);
    next();
};

/**
 * Handler for logging errors.
 * @param err
 * @param req
 * @param res
 * @param _next
 */
export const errorLoggerHandler = (err, req, res, _next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown IP';
    const host = req.headers.host || 'Unknown Host';
    const referer = req.headers.referer || req.get('referer') || 'No Referer';

    const errorMessage = `${req.method} ${req.url} from: {IP:${ip} Host:${host} Referer:${referer}} - ${err.message}`;

    logger.error(errorMessage, { stack: err.stack });
    console.error('Server error: "', err.message, '" Check for details in logs/errors.log');
    res.status(500).json({ error: 'Internal Server Error.' });
}
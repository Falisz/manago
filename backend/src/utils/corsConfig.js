// BACKEND/utils/corsConfig.js
/**
 * Returns CORS configuration options
 * @returns {Object} CORS configuration
 */
export function getCorsConfig() {
    return {
        origin: ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        preflightContinue: false
    };
}
// BACKEND/utils/validateEnv.js

/**
 * Validates that all required environment variables are present.
 * @throws {Error} If any required environment variables are missing
 */
export function validateEnv() {
    const requiredEnvVars = [
        'PORT',
        'JWT_ACCESS_SECRET',
        'JWT_REFRESH_SECRET',
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
}
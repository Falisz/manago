// BACKEND/utils/securityLogs.js
import {now} from 'sequelize/lib/utils';
import AppSecurityLog from '../models/AppSecurityLog.js';

/**
 * Logs a security-related event to the database.
 * @param {number} user - The user ID associated with the event.
 * @param {string} org - The organization associated with the event.
 * @param {string} action - The action performed by the user.
 * @param {string} message - Additional details about the event.
 * @returns {Promise<void>}
 */
export async function securityLog(user, org, action, message) {
    await AppSecurityLog.create({ timestamp: now(), user, org, action, message});
}
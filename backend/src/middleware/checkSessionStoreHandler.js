// BACKEND/middleware/checkSessionStoreHandler.js
import checkAccess from '#utils/checkAccess.js';
import { securityLog } from '#utils/securityLogs.js';
import { getConfig } from "#controllers";
import { Session } from "#models";
import { Op } from 'sequelize';

const checkSessionStoreHandler = async (req, res, next) => {
    const publicRules = [
        { path: '/', methods: ['GET'] },
        { path: '/auth', methods: ['POST'] },
        { path: '/ping', methods: ['GET'] }
    ];

    const isPublic = publicRules.some(rule => rule.path === req.path && rule.methods.includes(req.method));
    if (isPublic) return next();

    const includeConfig = req.path === '/auth' && req.method === 'GET';

    try {
        const sessionId = req.cookies?.session_id;

        if (!sessionId) {
            return res.status(401).json({
                message: 'No valid Session Cookie found.',
                ...(includeConfig ? { app: {...(await getConfig()), is_connected: true, pages: [], modules: []} } : {})
            });
        }

        // Query the database for the session ID and ensure it hasn't expired
        const activeSession = await Session.findOne({
            where: {
                id: sessionId,
                expiresAt: { [Op.gt]: new Date() } // expiresAt must be greater than current time
            }
        });

        if (!activeSession) {
            // Invalid or expired session
            res.clearCookie('session_id', { httpOnly: true, sameSite: 'lax' });
            return res.status(401).json({
                message: 'Session invalid or expired.',
                ...(includeConfig ? { app: {...(await getConfig()), is_connected: true, pages: [], modules: []} } : {})
            });
        }

        const userId = activeSession.userId;

        req.user = userId;
        req.include_ppi = await checkAccess(userId, 'access', 'user-ppi');
        req.include_configs = await checkAccess(userId, 'access', 'user-configs');

        next();

    } catch (err) {
        console.warn('Session verification failed:', err.message);
        await securityLog(null, req.ip || 'unknown', 'Session Auth', `Failure: ${err.message}`);
        return res.status(500).json({ message: 'Internal server error during authentication.' });
    }
};

export default checkSessionStoreHandler;
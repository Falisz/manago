// BACKEND/api/checkJwt.js
import checkAccess from '../utils/checkAccess.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { securityLog } from '../utils/securityLogs.js';

/**
 * Middleware to check if a User is authenticated.
 * @param {Request} req
 * @param {Response} res
 * @param {number} res.status
 * @param {number} req.user
 * @param {boolean} req.include_ppi
 * @param {boolean} req.include_configs
 * @param {function} res.json
 * @param {NextFunction} next
 */
const checkJwtHandler = async (req, res, next) => {
    try {
        const token = req.cookies?.access_token;

        if (!token)
            return res.status(401).json({ message: 'Access denied. No token provided.' });

        const payload = verifyAccessToken(token);
        const userId = payload.userId;

        if (!userId)
            return res.status(401).json({ message: 'Access denied. No User ID found in the Token provided.' });

        req.user = userId;
        req.include_ppi = await checkAccess(userId, 'access', 'user-ppi');
        req.include_configs = await checkAccess(userId, 'access', 'user-configs');

        next();
    } catch (err) {
        console.warn('JWT verification failed:', err.message);
        await securityLog(null, req.ip || 'unknown', 'JWT Auth', `Failure: ${err.message}`);
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};
export default checkJwtHandler;
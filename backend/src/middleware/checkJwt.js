// BACKEND/api/checkJwt.js
import checkAccess from '#utils/checkAccess.js';
import {
    ACCESS_TOKEN_OPTIONS,
    REFRESH_TOKEN_OPTIONS,
    verifyRefreshToken, generateAccessToken, verifyAccessToken
} from '#utils/jwt.js';
import { securityLog } from '#utils/securityLogs.js';
import {getConfig} from "#controllers";
import Session from "#models/Session.js";

/**
 * Middleware to check if a User is authenticated.
 * @param {Request} req
 * @param {Response} res
 * @param {Number} req.user
 * @param {boolean} req.include_ppi
 * @param {boolean} req.include_configs
 * @param {function} res.json
 * @param {String | null} req.cookies.access_token
 * @param {String | null} req.cookies.refresh_token
 * @param {NextFunction} next
 */
const checkJwtHandler = async (req, res, next) => {
    // Public endpoint pass-through
    const publicRules = [
        { path: '/', methods: ['GET'] },
        { path: '/auth', methods: ['POST'] },
        { path: '/ping', methods: ['GET'] }
    ];
    const isPublic = publicRules
        .some(rule => rule.path === req.path && rule.methods.includes(req.method));
    if (isPublic)
        return next();

    // Semi-public endpoint exception
    const includeConfig = req.path === '/auth' && req.method === 'GET';

    try {
        //Checking JWT
        const access_token = req.cookies?.access_token;
        const refresh_token = req.cookies?.refresh_token;

        const { userId } = access_token ? verifyAccessToken(access_token) : {};

        if ((!access_token || !userId) && refresh_token) {
            const { userId, jti } = verifyRefreshToken(refresh_token);

            if ( userId && jti ) {
                const isActive = await Session.findOne({ where: { id: jti, userId } });

                if (isActive) {
                    const newAccessToken = generateAccessToken({ userId });
                    res.clearCookie('access_token', ACCESS_TOKEN_OPTIONS);
                    res.cookie('access_token', newAccessToken, ACCESS_TOKEN_OPTIONS);
                    await securityLog(userId, req.ip, 'Token Refresh', 'Success');
                } else {
                    res.clearCookie('access_token', ACCESS_TOKEN_OPTIONS);
                    res.clearCookie('refresh_token', REFRESH_TOKEN_OPTIONS);
                    return res.status(401).json({
                        message: 'Session revoked or expired.',
                        ...(includeConfig ? { app: {...(await getConfig()), is_connected: true, pages: [], modules: []} } : {})
                    });
                }
            }
        }

        if (!userId)
            return res.status(401).json({
                message: 'No valid Tokens found.',
                ...(includeConfig ? { app: {...(await getConfig()), is_connected: true, pages: [], modules: []} } : {})
            });

        req.user = userId;
        req.include_ppi = await checkAccess(userId, 'access', 'user-ppi');
        req.include_configs = await checkAccess(userId, 'access', 'user-configs');

        next();

    } catch (err) {
        console.warn('Access Token verification failed:', err.message);
        await securityLog(null, req.ip || 'unknown', 'JWT Auth', `Failure: ${err.message}`);
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};
export default checkJwtHandler;
// BACKEND/api/checkJwt.js
import checkAccess from '#utils/checkAccess.js';
import {generateAccessToken, verifyAccessToken, verifyRefreshToken} from '#utils/jwt.js';
import { securityLog } from '#utils/securityLogs.js';

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
        let userId;

        const access_token = req.cookies?.access_token;

        if (access_token) {
            const payload = verifyAccessToken(access_token);
            userId = payload.userId;
            if (!userId)
                return res.status(401).json({message: 'No User ID found in the Token provided.'});

        } else {
            const refreshToken = req.cookies?.refresh_token;

            if (!refreshToken)
                return res.status(401).json({message: 'No User Tokens found.'});

            // TODO: Add a token database check-up for validation revoking option.

            const { userId } = verifyRefreshToken(refreshToken);

            if (!userId)
                return res.status(401).json({message: 'No User ID found in the Token provided!'});

            const newAccessToken = generateAccessToken({ userId });

            res.cookie('access_token', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 60 * 1000
            });
            await securityLog(userId, req.ip, 'Token Refresh', 'Success');
        }

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
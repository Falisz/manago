// BACKEND/utils/checkAuth.js
import checkAccess from './checkAccess.js';

/**
 * Middleware to check if a User is authenticated.
 * @param {Request} req
 * @param {Object} req.session
 * @param {Response} res
 * @param {number} res.status
 * @param {function} res.json
 * @param {NextFunction} next
 */
const checkAuthHandler = async (req, res, next) => {

    // if (!req.session.user)
    //     return res.status(401).json('Unauthorized. Please log in.');

    // Further lines are prototype implementation.

    // req.include_ppi = await checkAccess(req.session.user, 'access', 'user-ppi');
    // req.include_configs = await checkAccess(req.session.user, 'access', 'user-configs');

    next();
};
export default checkAuthHandler;
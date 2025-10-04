// BACKEND/utils/checkAuth.js
import {hasManagerAccess} from "../controllers/users.js";

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

    if (!req.session.user)
        return res.status(401).json('Unauthorized. Please log in.');

    // Further lines are prototype implementation.
    const hasAccess = await hasManagerAccess(req.session.user);

    req.include_ppi = hasAccess;
    req.include_configs = hasAccess;

    next();
};
export default checkAuthHandler;
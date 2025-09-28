// BACKEND/utils/checkAuth.js

/**
 * Middleware to check if user is authenticated.
 * @param {Request} req
 * @param {Object} req.session
 * @param {Response} res
 * @param {number} res.status
 * @param {function} res.json
 * @param {NextFunction} next
 */
const checkAuthHandler = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    next();
};
export default checkAuthHandler;
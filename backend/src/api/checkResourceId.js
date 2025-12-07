// BACKEND/api/checkResourceId.js

/**
 * Middleware to check if the ID is provided properly in the parameter.
 * @param {Request} req
 * @param {Object} req.params
 * @param {Response} res
 * @param {number} res.status
 * @param {function} res.json
 * @param {NextFunction} next
 */
const checkResourceIdHandler = (req, res, next) => {
    const { id } = req.params;

    if (!id)
        return res.status(400).json({ message: 'Resource ID is missing.' });

    if (isNaN(id))
        return res.status(400).json({ message: `Invalid Resource ID (${id}: ${typeof id}). ID must be a number.` });

    next();
};
export default checkResourceIdHandler;
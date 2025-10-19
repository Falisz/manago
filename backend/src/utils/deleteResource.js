// BACKEND/utils/deleteResource.js

/**
 * Middleware to delete the resource provided as a parameter.
 * @param {Request} req
 * @param {number} req.body.id
 * @param {Response} res
 * @param resourceName
 * @param deleteFunction
 * @param args
 */
const deleteResource = async (req, res, resourceName, deleteFunction, ...args) => {
    let ids;
        
    if (req.params.id)
        ids = [parseInt(req.params.id)];
    
    else if (req.body.id)
        if (Array.isArray(req.body.id))
            ids = req.body.id.filter(id => id != null && !isNaN(id)).map(id => parseInt(id));
        else
            ids = [parseInt(req.body.id)];
    
    else
        return res.status(400).json({ message: `${resourceName} IDs are missing.` });
    
    if (ids.length === 0)
        return res.status(400).json({ message: `No valid ${resourceName} IDs provided.` });

    // const hasAccess = hasAccess(req.session.user, 'delete', resourceName.toLowerCase(), ids);

    try {
        const { success, message, deletedCount } = await deleteFunction(ids, ...args);

        if (!success)
            return res.status(400).json({ message });

        return res.json({ message, deletedCount });
        
    } catch (err) {
        if (ids.length > 1) 
            console.error(`Error deleting ${resourceName}s (IDs: ${ids.join(', ')}):`, err);
        else
            console.error(`Error deleting ${resourceName} (ID: ${ids[0]}):`, err);

        return res.status(500).json({ message: 'Server error.' });
    }
};
export default deleteResource;
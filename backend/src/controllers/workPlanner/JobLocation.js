// BACKEND/controller/workPlanner/jobLocations.js
import {Op} from 'sequelize';
import {JobLocation, Shift} from '#models';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';
import randomId from '#utils/randomId.js';
import sequelize from '#utils/database.js';

/**
 * Retrieves one Job Location by its ID or all Job Locations if an ID is not provided.
 * @param {number|null} id - optional - Job Location ID to fetch a specific location
 * @returns {Promise<Object|Object[]|null>} Single Job Location, array of Job Locations, or null
 */
export async function getJobLocation({ id } = {}) {

    if (id && !isNaN(id)) {
        const location = await JobLocation.findByPk(id, {raw: true });

        if (!location)
            return null;

        return location;
    }

    const locations = await JobLocation.findAll({ raw: true });

    if (!locations || locations.length === 0)
        return [];

    return locations;
}

/**
 * Creates a new Job Location.
 * @param {Object} data
 * @param {string} data.name - Required - Location name (must be unique)
 * @param {string} [data.description] - Optional description
 * @param {string} [data.color] - Optional hex color (e.g. "#FF5733")
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createJobLocation(data) {
    if (!data.name)
        return { success: false, message: 'Job Location name is required.' };

    const existing = await JobLocation.findOne({ where: { name: data.name } });
    if (existing)
        return { success: false, message: 'There already is a Job Location with provided name. Use a different one.' };

    const location = await JobLocation.create({
        id: await randomId(JobLocation),
        name: data.name,
        description: data.description || null,
        color: data.color || null
    });

    return { success: true, message: 'Job Location created successfully.', id: location.id };
}

/**
 * Updates an existing Job Location.
 * @param {number} id - Job Location ID
 * @param {Object} data - Fields to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateJobLocation(id, data) {
    if (!id)
        return { success: false, message: 'Job Location ID not provided.' };

    const location = await JobLocation.findOne({ where: { id } });

    if (!location)
        return { success: false, message: 'Job Location not found.' };

    // Check name uniqueness if it's being changed
    if (data.name) {
        const existing = await JobLocation.findOne({
            where: {
                name: data.name,
                id: { [Op.ne]: id } // not equal to current record
            }
        });
        if (existing)
            return { success: false, message: 'Another Job Location with this name already exists.' };
    }

    await location.update(data);

    return { success: true, message: 'Job Location updated successfully.' };
}

/**
 * Deletes one or multiple Job Locations.
 * Shifts with this location will have job_location set to NULL (not deleted).
 * @param {number|number[]} id - Single ID or array of IDs
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteJobLocation(id) {
    if (!isNumberOrNumberArray(id))
        return { success: false, message: `Invalid Job Location ID${Array.isArray(id) ? 's' : ''} provided.` };

    const transaction = await sequelize.transaction();

    try {
        // First: clear references in shifts (set job_location = NULL)
        await Shift.update(
            { job_location: null },
            { where: { job_location: id }, transaction }
        );

        // Then: delete the location(s)
        const deletedCount = await JobLocation.destroy({
            where: { id },
            transaction
        });

        if (!deletedCount) {
            await transaction.rollback();
            return {
                success: false,
                message: `No Job Locations found to delete for provided ID${Array.isArray(id) && id.length > 1 ? 's' : ''}: ${Array.isArray(id) ? id.join(', ') : id}`
            };
        }

        await transaction.commit();

        return {
            success: true,
            message: `${deletedCount} Job Location${deletedCount > 1 ? 's' : ''} deleted successfully.`,
            deletedCount
        };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
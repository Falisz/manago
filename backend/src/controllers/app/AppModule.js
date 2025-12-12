// BACKEND/controllers/app/AppModule.js
import {AppModule} from '#models';

/**
 * Retrieves all modules sorted by ID in ascending order.
 * @returns {Promise<Object[]>} Array of module objects.
 */
export async function getModules() {
    return await AppModule.findAll({ order: [['id', 'ASC']] });
}

/**
 * Updates the enabled status of a module by its ID.
 * @param {number} id - The ID of the module to update.
 * @param {boolean} value - The new enabled status to set.
 * @returns {Promise<number>} The number of affected rows.
 */
export async function setModule(id, value) {
    return await AppModule.update({ enabled: value }, { where: { id } });
}
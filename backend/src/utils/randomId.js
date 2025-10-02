// BACKEND/utils/randomId.js

/**
 * Generates a unique random ID for a given Sequelize model.
 * Ensures the generated ID does not already exist in the model's table.
 * @param {Object} model - Sequelize model to check for existing IDs
 * @returns {Promise<number>} Unique random ID
 * @throws {Error} If model is not provided
 */
export const randomId = async (model) => {
    if (!model)
        throw new Error('Model is required to generate a unique ID.');

    while (true) {
        const id = Math.floor(Math.random() * 900000) + 100000;
     
        if (!(await model.findOne({where: {id}})))
            return id;
    }
}

export default randomId;
// BACKEND/controller/user/ContractType.js
import {Op} from "sequelize";
import {Contract, ContractType} from '#models';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';
import randomId from '#utils/randomId.js';
import sequelize from '#utils/database.js';

/**
 * Retrieves one ContractType by its ID or all ContractTypes if ID is not provided.
 * @param {number|null} id - optional - ContractType ID to fetch a specific ContractType
 * @param {boolean} contracts - optional - Should Contracts be added to the output ContractType
 * @returns {Promise<Object|Object[]|null>} ContractType, array of ContractTypes, or null
 */
export async function getContractType({id} = {}) {

    if (!id || isNaN(id)) {
        const types = await ContractType.findAll({
            order: [['id', 'ASC']],
            raw: true
        });

        if (!types?.length)
            return [];

        return types;
    }

    let type = await ContractType.findOne({
        where: { id },
        raw: true
    });

    if (!type)
        return null;

    return type;
}

/**
 * Creates a new ContractType.
 * @param {Object} data - ContractType data
 * @param {string} data.name - ContractType name
 * @param {string|null} data.description - ContractType description
 * @param {number|null} data.hours_per_week - Default hours per week
 * @param {number|null} data.hours_per_day - Default hours per day
 * @param {number|null} data.work_mode - Work mode (0 - office, 1 - remote, 2 - hybrid, 3 - field)
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createContractType(data) {
    if (!data.name)
        return {
            success: false,
            message: 'Name is required to create a new Contract Type!'
        };

    if (await ContractType.findOne({ where: { name: data.name }}))
        return {
            success: false,
            message: 'The Contract Type with this exact name already exists.'
        };

    const contractType = await ContractType.create({
        id: await randomId(ContractType),
        name: data.name,
        description: data.description || null,
        hours_per_week: data.hours_per_week || null,
        hours_per_day: data.hours_per_day || null,
        work_mode: data.work_mode || null
    });

    return {
        success: true,
        message: 'Contract Type created successfully.',
        id: contractType.id
    };
}

/**
 * Updates an existing ContractType.
 * @param {number} id - ContractType ID
 * @param {Object} data - ContractType data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateContractType(id, data) {

    if (!id)
        return {
            success: false,
            message: 'ContractType ID not provided.'
        };

    const contractType = await ContractType.findOne({ where: { id } });

    if (!contractType)
        return {
            success: false,
            message: 'ContractType not found.'
        };

    if (data.name && data.name !== contractType.name &&
        await ContractType.findOne({ where: { name: data.name, id: { [Op.ne]: id } }}))
        return {
            success: false,
            message: 'The other ContractType with this exact name already exists.'
        };

    await contractType.update(data);

    return {
        success: true,
        message: 'ContractType updated successfully.'
    };
}

/**
 * Deletes one or multiple ContractTypes.
 * @param {number|number[]} id - ContractType ID or array of ContractType IDs
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteContractType(id) {

    if (!isNumberOrNumberArray(id))
        return {
            success: false,
            message: `Invalid ContractType ID${Array.isArray(id) ? 's' : ''} provided.`
        };

    const transaction = await sequelize.transaction();

    try {
        const usedCount = await Contract.count({
            where: { type: id },
            transaction
        });

        if (usedCount > 0) {
            await transaction.rollback();
            return {
                success: false,
                message: 'Cannot delete ContractType(s) that are in use by Contracts.'
            };
        }

        const deletedTypes = await ContractType.destroy({
            where: { id },
            transaction
        });

        if (!deletedTypes) {
            await transaction.rollback();
            return {
                success: false,
                message: `No ContractTypes found to delete for provided ID
                ${Array.isArray(id) && id.length > 1 ? 's' : ''}: ${Array.isArray(id) ? id.join(', ') : id}`
            };
        }

        await transaction.commit();

        return {
            success: true,
            message: `${deletedTypes} ContractType${deletedTypes > 1 ? 's' : ''} deleted successfully.`,
            deletedCount: deletedTypes
        };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
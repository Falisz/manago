// BACKEND/controller/user/Contract.js
import {User, Contract, ContractType} from '#models';
import sequelize from '#utils/database.js';
import randomId from '#utils/randomId.js';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';

/**
 * Retrieves multiple Contracts or just one Contract by its ID.
 * @param id
 * @param user
 * @param type
 * @returns {Promise<*>}
 */
export async function getContract({id, user, type} = {}) {

    function flattenContract (data) {
        const userContract = data.toJSON();
        userContract.type = userContract['ContractType']?.toJSON();
        delete userContract['ContractType'];
        return userContract;
    }

    if (!Number.isNaN(id)) {
        const result = await Contract.findByPk(id, {include: ContractType});
        return flattenContract(result);
    }

    const where = {};

    if (Number.isInteger(user))
        where.user = user;

    if (Number.isInteger(type))
        where.type = type;

    const result = await Contract.findAll({ where, include: ContractType });
    return result.map(record => flattenContract(record));
}

/**
 * Creates a new Contract.
 * @param {Object} data - Contract data
 * @param {number} data.user - User ID
 * @param {number} data.type - ContractType ID
 * @param {string} data.start_date - Start date (DATEONLY)
 * @param {string|null} data.end_date - End date (DATEONLY)
 * @param {number|null} data.parent_contract - Parent Contract ID
 * @param {number|null} data.hours_per_week - Hours per week
 * @param {number|null} data.hours_per_day - Hours per day
 * @param {string|null} data.notes - Notes
 * @param {string|null} data.file - File path
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createContract(data) {

    if (!data || typeof data !== 'object' || !data.user || !data.type || !data.start_date)
        return {
            success: false,
            message: 'Mandatory data (user, type, start_date) not provided.'
        };

    const userExists = await User.findByPk(data.user);
    if (!userExists)
        return {
            success: false,
            message: 'User not found.'
        };

    const typeExists = await ContractType.findByPk(data.type);
    if (!typeExists)
        return {
            success: false,
            message: 'ContractType not found.'
        };

    if (data.parent_contract) {
        const parentExists = await Contract.findByPk(data.parent_contract);
        if (!parentExists)
            return {
                success: false,
                message: 'Parent Contract not found.'
            };
    }

    const contract = await Contract.create({
        id: await randomId(Contract),
        user: data.user,
        type: data.type,
        start_date: data.start_date,
        end_date: data.end_date || null,
        parent_contract: data.parent_contract || null,
        hours_per_week: data.hours_per_week || null,
        hours_per_day: data.hours_per_day || null,
        notes: data.notes || null,
        file: data.file || null
    });

    return {
        success: true,
        message: 'Contract created successfully.',
        id: contract.id
    };
}

/**
 * Updates an existing Contract.
 * @param {number} id - Contract ID
 * @param {Object} data - Contract data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateContract(id, data) {

    if (!id)
        return {
            success: false,
            message: 'Contract ID not provided.'
        };

    const contract = await Contract.findByPk(id);

    if (!contract)
        return {
            success: false,
            message: 'Contract not found.'
        };

    if (data.user) {
        const userExists = await User.findByPk(data.user);
        if (!userExists)
            return {
                success: false,
                message: 'User not found.'
            };
    }

    if (data.type) {
        const typeExists = await ContractType.findByPk(data.type);
        if (!typeExists)
            return {
                success: false,
                message: 'Contract Type not found.'
            };
    }

    if (data.parent_contract) {
        const parentExists = await Contract.findByPk(data.parent_contract);
        if (!parentExists)
            return {
                success: false,
                message: 'Parent Contract not found.'
            };
    }

    await contract.update(data);

    return {
        success: true,
        message: 'Contract updated successfully.'
    };
}

/**
 * Deletes one or multiple Contracts.
 * @param {number|number[]} id - Contract ID or array of Contract IDs
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteContract(id) {

    if (!isNumberOrNumberArray(id))
        return {
            success: false,
            message: `Invalid Contract ID${Array.isArray(id) ? 's' : ''} provided.`
        };

    const transaction = await sequelize.transaction();

    try {
        const childCount = await Contract.count({
            where: { parent_contract: id },
            transaction
        });

        if (childCount > 0) {
            await transaction.rollback();
            return {
                success: false,
                message: 'Cannot delete Contract(s) that have child Contracts.'
            };
        }

        const deletedContracts = await Contract.destroy({
            where: { id },
            transaction
        });

        if (!deletedContracts) {
            await transaction.rollback();
            return {
                success: false,
                message: `No Contracts found to delete for provided ID${Array.isArray(id) && id.length > 1 ? 's' : ''}:
                 ${Array.isArray(id) ? id.join(', ') : id}`
            };
        }

        await transaction.commit();

        return {
            success: true,
            message: `${deletedContracts} Contract${deletedContracts > 1 ? 's' : ''} deleted successfully.`,
            deletedCount: deletedContracts
        };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
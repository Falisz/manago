// BACKEND/controller/organization/Branch.js
import {Op} from 'sequelize';
import {Branch, BranchUser} from '#models';
import {getBranchUsers} from '#controllers';
import sequelize from '#utils/database.js';
import randomId from '#utils/randomId.js';
import isNumberOrNumberArray from "#utils/isNumberOrNumberArray.js";

/**
 * Retrieves one Branch by its ID or all Branches if ID is not provided.
 * @param {number} id - optional - Branch ID to fetch a specific branch
 * @param {boolean} get_members - optional - Should members be fetched for the found Branches?
 * @returns {Promise<Object|Array|null>} Single Branch, array of Branches, or null
 */
export async function getBranch({ id, get_members = true } = {}) {
    async function expandBranch(branch) {
        if (get_members) {
            branch.members = await getBranchUsers(branch.id, null, true);
            branch.leaders = await getBranchUsers(branch.id, 1, true);
            branch.managers = await getBranchUsers(branch.id, 2, true);
        }
        return branch;
    }

    // Logic if no ID is provided - fetch all Branches
    if (!id || isNaN(id)) {
        const branches = await Branch.findAll({
            order: [['id', 'ASC']],
            raw: true
        });

        if (!branches || branches.length === 0) {
            return [];
        }

        return await Promise.all(branches.map(branch => expandBranch(branch)));
    }

    // Logic if the ID is provided - fetch a specific Branch
    const branch = await Branch.findOne({ where: { id }, raw: true });

    if (!branch) {
        return null;
    }

    return await expandBranch(branch);
}

/**
 * Creates a new Branch.
 * @param {Object} data - Branch data
 * @param {string} data.name - Branch name
 * @param {string} [data.description] - optional - Branch description
 * @param {boolean} [data.active] - optional - Branch active status
 * @param {string} [data.location] - optional - Branch location
 * @param {Date} [data.founding_date] - optional - Branch founding date
 * @param {Object} [data.data] - optional - Additional JSON data
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createBranch(data) {
    if (!data.name) {
        return {
            success: false,
            message: 'Mandatory data (name) not provided.'
        };
    }

    if (await Branch.findOne({ where: { name: data.name } })) {
        return {
            success: false,
            message: 'A branch with this name already exists.'
        };
    }

    const branch = await Branch.create({
        id: await randomId(Branch),
        name: data.name,
        description: data.description || null,
        active: data.active !== undefined ? data.active : true,
        location: data.location || null,
        founding_date: data.founding_date || null,
        data: data.data || null
    });

    return {
        success: true,
        message: 'Branch created successfully.',
        id: branch.id
    };
}

/**
 * Updates an existing Branch.
 * @param {number} id - Branch ID
 * @param {Object} data - Branch data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateBranch(id, data) {
    if (!id) {
        return {
            success: false,
            message: 'Branch ID not provided.'
        };
    }

    const branch = await Branch.findOne({ where: { id } });

    if (!branch) {
        return {
            success: false,
            message: 'Branch not found.'
        };
    }

    if (data.name && await Branch.findOne({ where: { id: { [Op.ne]: id }, name: data.name } })) {
        return {
            success: false,
            message: 'A branch with this name already exists.'
        };
    }

    await branch.update(data);

    return {
        success: true,
        message: 'Branch updated successfully.'
    };
}

/**
 * Deletes one or multiple Branches and their assignments.
 * @param {number|number[]} id - Branch ID or array of Branch IDs
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteBranch(id) {
    if (!isNumberOrNumberArray(id)) {
        return {
            success: false,
            message: `Invalid Branch ID${Array.isArray(id) ? 's' : ''} provided.`
        };
    }

    const transaction = await sequelize.transaction();

    try {
        const deletedBranches = await Branch.destroy({ where: { id }, transaction });

        if (!deletedBranches) {
            await transaction.rollback();
            return {
                success: false,
                message: `No Branches found to delete for provided ID${Array.isArray(id) && id.length > 1 ? 's' : ''}: ${Array.isArray(id) ? id.join(', ') : id}`
            };
        }

        await BranchUser.destroy({ where: { branch: id }, transaction });

        await transaction.commit();

        return {
            success: true,
            message: `${deletedBranches} Branch${deletedBranches > 1 ? 'es' : ''} deleted successfully.`,
            deletedCount: deletedBranches
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
// BACKEND/controller/workPlanner/absenceTypes.js
import {Absence, AbsenceType} from '#models';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';
import randomId from '#utils/randomId.js';
import {Op} from "sequelize";
/**
 * Retrieves one Absence Type by its ID or all Absence Types if an ID is not provided.
 * @param {number|null} id - optional - Absence Type ID to fetch a specific Absence Type
 * @returns {Promise<Object|Object[]|null>} Single Absence Type, array of Absence Types, or null
 */
export async function getAbsenceType({id} = {}) {
    if (!id || isNaN(id))
        return await AbsenceType.findAll({ raw: true });

    return await AbsenceType.findOne({ where: {id}, raw: true });
}

/**
 * Creates a new Absence Type.
 * @param {Object} data - Absence Type data
 * @param {string} data.name - Absence Type name
 * @param {string} data.parent_type -
 * @param {string} data.amount -
 * @param {string} data.color -
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createAbsenceType(data) {
    if (!data.name)
        return { success: false, message: 'Absence Type name is required.' };

    if (await AbsenceType.findOne({ where: { name: data.name } }))
        return { success: false, message: 'Absence Type name is currently used.' };

    if (data.parent_type && !(await AbsenceType.findOne({ where: { id: data.parent_type}})))
        return { success: false, message: 'Parent Absence Type not found.'};

    if (data.amount && isNaN(data.amount))
        return { success: false, message: 'Absence amount must be a number.'};

    const type = await AbsenceType.create({
        id: await randomId(AbsenceType),
        name: data.name,
        parent_type: data.parent_type || null,
        amount: data.amount || null,
        color: data.color || null
    });

    return { success: true, message: 'Absence Type created successfully.', id: type.id };
}

/**
 * Updates an existing Absence Type.
 * @param {number} id - Absence Type ID
 * @param {Object} data - Absence Type data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateAbsenceType(id, data) {
    if (!id)
        return { success: false, message: 'AbsenceType ID not provided.' };

    const leaveType = await AbsenceType.findOne({ where: { id } });

    if (!leaveType)
        return { success: false, message: 'AbsenceType not found.' };

    if (data.name && await AbsenceType.findOne({ where: { name: data.name, id: { [Op.ne]: id }} }))
        return { success: false, message: 'Name provided is currently used by other Absence Type.' };

    if (data.parent_type && !(await AbsenceType.findOne({ where: { id: data.parent_type}})))
        return { success: false, message: 'Provided parent Absence Type not found.'};

    if (data.amount && isNaN(data.amount))
        return { success: false, message: 'Absence amount must be a number.'};

    await leaveType.update(data);

    return { success: true, message: 'Absence Type updated successfully.' };
}

/**
 * Deletes one or multiple Absence Types and their assignments.
 * @param {number|number[]} id - Single Absence Type ID or array of Absence Type IDs
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteAbsenceType(id) {
    if (!isNumberOrNumberArray(id))
        return { success: false, message: 'Invalid Absence Type ID(s) provided.' };

    await Absence.update({ type: null }, { where: { type: id }});

    const deleted = await AbsenceType.destroy({ where: { id } });

    if (!deleted)
        return { success: false, message: 'No Absence Types found to delete.' };

    return {
        success: true,
        message: `${deleted} Leave Type${deleted > 1 ? 's' : ''} deleted successfully.`,
        deletedCount: deleted
    };
}
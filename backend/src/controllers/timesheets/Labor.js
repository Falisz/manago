// BACKEND/controller/timesheets/Labor.js
import {Op} from 'sequelize';
import {Labor, Project, User, LaborStatus, LaborType} from '#models';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';
import randomId from '#utils/randomId.js';

/**
 * Retrieves one Labor record by its ID or all Labor records if an ID is not provided.
 * @param {number|null} id - optional - Labor ID to fetch a specific Labor record
 * @param {number|number[]|null} user - optional - User ID or array of User IDs
 * @param {number|number[]|null} project - optional - Project ID or array of Project IDs
 * @param {string|string[]|null} type - optional - Labor Type or array of Labor Types
 * @param {number|number[]|null} status - optional - Status ID or array of Status IDs
 * @param {number|number[]|null} approver - optional - Approver User ID or array of Approver User IDs
 * @param {string|null} date - optional - Specific date
 * @param {string|null} from - optional - Start date for range
 * @param {string|null} to - optional - End date for range
 * @returns {Promise<Object|Object[]|null>} Single Labor record, array of Labor records, or null
 */
export async function getLabor({id, user, project, type, status, approver, date, from, to} = {}) {

    const where = {};

    if (isNumberOrNumberArray(id))
        where.id = id;

    if (isNumberOrNumberArray(user))
        where.user = user;

    if (isNumberOrNumberArray(project) || project === null)
        where.project = project;

    if (type)
        where.type = type;

    if (isNumberOrNumberArray(status))
        where.status = status;

    if (isNumberOrNumberArray(approver) || approver === null)
        where.approver = approver;

    if (date)
        where.date = date;

    else if (from && to)
        where.date = {[Op.between]: [from, to]};

    else if (from)
        where.date = {[Op.gte]: from};

    else if (to)
        where.date = {[Op.lte]: to};

    const include = [
        { model: User, attributes: ['id', 'first_name', 'last_name'], as: 'User' },
        { model: User, attributes: ['id', 'first_name', 'last_name'], as: 'Approver' },
        { model: Project, attributes: ['id', 'name'] },
        { model: LaborType, attributes: ['id', 'name'] },
        { model: LaborStatus, attributes: ['id', 'name'] }
    ];

    const labors = await Labor.findAll({ where, include });

    if (!labors || labors.length === 0)
        return [];

    return await Promise.all(labors.map(async labor => {
        const rawData = labor.toJSON();

        rawData.user = labor['User']?.toJSON();
        rawData.approver = labor['Approver']?.toJSON();
        rawData.project = labor['Project']?.toJSON();
        rawData.type = labor['LaborType']?.toJSON();
        rawData.status = labor['LaborStatus']?.toJSON();

        delete rawData['User'];
        delete rawData['Approver'];
        delete rawData['Project'];
        delete rawData['LaborType'];
        delete rawData['LaborStatus'];

        return rawData;
    }));
}

/**
 * Creates a new Labor record.
 * @param {Object} data - Labor data
 * @param {string} data.date - Labor date
 * @param {number} data.user - User ID
 * @param {number} data.time - Time spent (hours)
 * @param {number|null} data.project - optional - Project ID
 * @param {string|null} data.type - optional - Labor Type
 * @param {number} data.status - Status ID
 * @param {number|null} data.approver - optional - Approver User ID
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createLabor(data) {
    if (!data.date)
        return { success: false, message: 'Date is required.' };

    if (!data.user)
        return { success: false, message: 'User is required.' };

    if (data.time == null)
        return { success: false, message: 'Time is required.' };

    if (!data.type)
        return { success: false, message: 'Type is required.' };

    if (!data.status)
        return { success: false, message: 'Status is required.' };


    const [user, project, type, status, approver] = await Promise.all([
        User.findByPk(data.user),
        data.project ? Project.findByPk(data.project) : Promise.resolve(null),
        LaborType.findByPk(data.type),
        LaborStatus.findByPk(data.status),
        data.approver ? User.findByPk(data.approver) : Promise.resolve(null),
    ]);

    if (!user)
        return { success: false, message: 'User not found.' };
    if (data.project && !project)
        return { success: false, message: 'Project not found.' };
    if (!type)
        return { success: false, message: 'Labor Type not found.' };
    if (!status)
        return { success: false, message: 'Status not found.' };
    if (data.approver && !approver)
        return { success: false, message: 'Approver not found.' };

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date))
        return { success: false, message: 'Invalid date format. Use YYYY-MM-DD.' };

    if (typeof data.time !== 'number' || data.time <= 0)
        return { success: false, message: 'Time must be a positive number.' };

    const labor = await Labor.create({
        id: await randomId(Labor),
        date: data.date,
        user: data.user,
        time: data.time,
        project: data.project || null,
        type: data.type || null,
        status: data.status,
        approver: data.approver || null
    });

    return { success: true, message: 'Labor record created successfully.', id: labor.id };
}

/**
 * Updates an existing Labor record.
 * @param {number} id - Labor ID
 * @param {Object} data - Labor data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateLabor(id, data) {
    if (!id)
        return { success: false, message: 'Labor ID not provided.' };

    if (!data)
        return { success: false, message: 'Update data not provided.' };

    const labor = await Labor.findByPk(id);

    if (!labor)
        return { success: false, message: 'Labor record not found.' };

    const updates = {};

    // === Optional: date ===
    if (data.date !== undefined) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date))
            return { success: false, message: 'Invalid date format. Use YYYY-MM-DD.' };
        updates.date = data.date;
    }

    // === Optional: user ===
    if (data.user !== undefined) {
        const user = await User.findByPk(data.user);
        if (!user) return { success: false, message: 'User not found.' };
        updates.user = data.user;
    }

    // === Optional: time ===
    if (data.time !== undefined) {
        if (typeof data.time !== 'number' || data.time <= 0)
            return { success: false, message: 'Time must be a positive number.' };
        updates.time = data.time;
    }

    // === Optional: project ===
    if (data.project !== undefined) {
        if (data.project !== null) {
            const project = await Project.findByPk(data.project);
            if (!project) return { success: false, message: 'Project not found.' };
        }
        updates.project = data.project;
    }

    // === Optional: type ===
    if (data.type !== undefined) {
        if (data.type !== null) {
            const laborType = await LaborType.findByPk(data.type);
            if (!laborType) return { success: false, message: 'Labor Type not found.' };
        }
        updates.type = data.type;
    }

    // === Optional: status ===
    if (data.status !== undefined) {
        const status = await LaborStatus.findByPk(data.status);
        if (!status) return { success: false, message: 'Status not found.' };
        updates.status = data.status;
    }

    // === Optional: approver ===
    if (data.approver !== undefined) {
        if (data.approver !== null) {
            const approver = await User.findByPk(data.approver);
            if (!approver) return { success: false, message: 'Approver not found.' };
        }
        updates.approver = data.approver;
    }

    await labor.update(updates);

    return { success: true, message: 'Labor record updated successfully.' };
}

/**
 * Deletes one or multiple Labor records.
 * @param {number|number[]} id - Single Labor ID or array of Labor IDs
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteLabor(id) {
    if (!isNumberOrNumberArray(id))
        return { success: false, message: `Invalid Labor ID${Array.isArray(id) ? 's' : ''} provided.` };

    const deletedCount = await Labor.destroy({ where: { id } });

    if (!deletedCount)
        return {
            success: false,
            message: `No Labor records found to delete for provided ID${Array.isArray(id) && id.length > 1 ? 's' : ''}:
                ${Array.isArray(id) ? id.join(', ') : id}`
        };

    return {
        success: true,
        message: `${deletedCount} Labor record${deletedCount > 1 ? 's' : ''} deleted successfully.`,
        deletedCount
    };
}
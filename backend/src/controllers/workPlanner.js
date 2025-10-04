// BACKEND/controller/workPlanner.js
import { Shift, JobPost, Schedule, Holiday } from '../models/workPlanner.js';
import { User } from '../models/users.js';
import { getUser } from './users.js';
import { Op } from 'sequelize';
import randomId from "../utils/randomId.js";
import isNumberOrNumberArray from "../utils/isNumberOrNumberArray.js";
import sequelize from "../utils/database.js";

// Holidays
/**
 * Retrieves one Holiday by its ID or all Holidays if an ID is not provided.
 * @param {number|null} id - optional - Holiday ID to fetch a specific Holiday
 * @param {string} start_date - optional -
 * @param {string} end_date - optional -
 * @returns {Promise<Object|Object[]|null>} Single Holiday, array of Holidays, or null
 */
export async function getHoliday({id, start_date, end_date} = {}) {

    if (!id) {    
        const where = {};

        if (start_date && end_date)
            where.date = {[Op.between]: [start_date, end_date]}
        else if (start_date)
            where.date = {[Op.gte]: start_date}
        else if (end_date)
            where.date = {[Op.lte]: end_date}
        
        return await Holiday.findAll({ where }) || {};
    }

    return await Holiday.findByPk(id) || null;
}

/**
 * Creates a new Holiday.
 * @param {Object} data - Holiday data
 * @param {string} data.name - Holiday name
 * @param {string} data.date - Holiday date
 * @param {string} data.requestable_working - optional
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createHoliday(data) {
    if (!data.name)
        return {
            success: false,
            message: 'Name is required to create a new Holiday!'
        };

    if (!data.date)
        return {
            success: false,
            message: 'Date is required to create a new Holiday!'
        };

    if (await Holiday.findOne({ where: { date: data.date }}))
        return {
            success: false,
            message: 'There currently is Holiday marked for the specified date.'
        };

    const holiday = await Holiday.create({
        id: await randomId(Holiday),
        name: data.name,
        date: data.date,
        requestable_working: data.requestable_working || true,
    });

    return {
        success: true,
        message: 'Holiday created successfully.',
        id: holiday.id
    };
}

/**
 * Updates an existing Holiday.
 * @param {number} id - Holiday ID
 * @param {Object} data - Holiday data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateHoliday(id, data) {
    if (!id)
        return {
            success: false,
            message: 'Holiday ID not provided.'
        };

    const holiday = await Holiday.findOne({ where: { id } });

    if (!holiday)
        return {
            success: false,
            message: 'Role not found.'
        };

    if (data.holiday && await Holiday.findOne({ where: { date: data.date }}))
        return {
            success: false,
            message: 'There currently is other Holiday marked for the specified date.'
        };

    await holiday.update(data);

    return {
        success: true,
        message: 'Holiday updated successfully.'
    };
}

/**
 * Deletes one or multiple Holidays and their assignments.
 * @param {number|number[]} id - Single Holiday ID or array of Holiday IDs
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteHoliday(id) {

    if (!isNumberOrNumberArray(id))
        return {
            success: false,
            message: `Invalid Holiday ID${Array.isArray(id) ? 's' : ''} provided.`
        };

    const transaction = await sequelize.transaction();

    try {
        const deletedHolidays = await Holiday.destroy({ where: { id }, transaction });

        if (!deletedHolidays) {
            await transaction.rollback();
            return {
                success: false,
                message: `No Holidays found to delete for provided ID${Array.isArray(id) && id.length > 1 ? 's' : ''}:
                 ${Array.isArray(id) ? id.join(', ') : id}`
            };
        }

        await transaction.commit();

        return {
            success: true,
            message: `${deletedHolidays} Holiday${deletedHolidays > 1 ? 's' : ''} deleted successfully.`,
            deletedCount: deletedHolidays
        };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

// Schedules
export async function getSchedule({id} = {}) {
    if (!id)
        return await Schedule.findAll() || [];

    return await Schedule.findByPk(id) || null;
}

export async function createSchedule(data) {
    if (!data.user && await getUser(data.user))
        return {
            success: true,
            message: 'Author User is required to create a schedule'
        }

    return Schedule.create(data);
}

export async function updateSchedule(id, data) {
    return await Schedule.update(data, { where: { id } });
}

export async function deleteSchedule(id) {
    return await Schedule.destroy({ where: { id } });
}

// Shifts
export async function createShift(data) {
    return Shift.create(data);
}

// where fields start_time and end_time should have $gte and $lte operators respectively i.e.:
// { start_time: { $gte: '2023-10-01T00:00:00Z' }, end_time: { $lte: '2023-10-31T23:59:59Z' }, job_post: 2, schedule: 5, user: 10 }
export async function getShift(where) {
    const validId = where.id !== null && ( (typeof where.id === 'number' && !isNaN(where.id)) ||
    (Array.isArray(where.id) && where.id.every(x => typeof x === 'number' && !isNaN(x))) );

    if (!validId) {
        delete where.id;
    }

    const include = [];
    
    if (where.user)
        include.push(User);

    if (where.job_post)
        include.push(JobPost);

    if (where.schedule)
        include.push(Schedule);
        
    return await Shift.findAll({ where, include }) || [];
}

export async function updateShift(id, data) {
    return await Shift.update(data, { where: { id } });
}

export async function deleteShifts(id) {
    return await Shift.destroy({ where: { id } });
}

// Job Posts
export async function createJobPost(data) {
    if (!data.name) {
        throw new Error('Job Post name is required');
    }
    return JobPost.create(data);
}

export async function getJobPost(where) {
    return await JobPost.findAll(where) || [];
}

export async function updateJobPost(id, data) {
    return await JobPost.update(data, { where: { id } });
}

export async function deleteJobPost(id) {
    return await JobPost.destroy({ where: { id } });
}

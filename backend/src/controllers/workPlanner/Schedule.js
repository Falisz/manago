// BACKEND/controller/workPlanner/Schedule.js
import {Schedule, Shift} from '#models';
import {getAbsence, getShift, getUser} from "#controllers";
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';
import randomId from '#utils/randomId.js';
import sequelize from '#utils/database.js';

/**
 * Retrieves one Working Schedule by its ID or all Schedules if an ID is not provided.
 * @param {number|null} id - optional - Schedule ID to fetch a specific Schedule
 * @param {number|null} author - optional - User ID(s) to fetch Schedules authored by that User(s)
 * @param start_date
 * @param end_date
 * @param {boolean} include_shifts - optional - Should there be shifts included for this fetched Schedule(s)? False by default.
 * @returns {Promise<Object|Object[]|null>} Single Schedule, array of Schedules, or null
 */
export async function getSchedule({id, author, start_date, end_date} = {}) {

    async function extendSchedule(schedule) {
        if (!schedule)
            return null;

        const users = await getUser({
            scope: schedule.user_scope,
            scope_id: schedule.user_scope_id
        });

        schedule.users = users;

        schedule.shifts = await getShift({
            schedule: schedule.id,
            user: users.map(user => user.id),
            from: schedule.start_date,
            to: schedule.end_date,
        });

        schedule.leaves = await getAbsence({
            user: users.map(user => user.id)
        });

        return schedule;
    }

    // Logic if the ID is provided - fetch a specific Schedule
    if (id && !isNaN(id)) {
        const schedule = await Schedule.findByPk(id, {raw: true});
        return await extendSchedule(schedule);
    }

    // Logic if no ID is provided - fetch all Schedules
    const where = {};

    if (author)
        where.author = author;

    if (start_date)
        where.start_date = start_date;

    if (end_date)
        where.end_date = end_date;

    const schedules = await Schedule.findAll({ where, raw: true });

    if (!schedules || schedules.length === 0)
        return [];

    return await Promise.all(
        schedules.map(async (schedule) => await extendSchedule(schedule))
    );
}
/**
 * Creates a new Schedule.
 * @param {Object} data - Schedule data
 * @param {string} data.name - optional - Schedule name
 * @param {string} data.description - optional - Schedule description
 * @param {string} data.user_scope - Schedule User Scope
 * @param {number} data.user_scope_id - Schedule User Scope ID
 * @param {string} data.start_date - Schedule start date
 * @param {string} data.end_date - Schedule end date
 * @param {number} data.author - User ID of Schedule author
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */

export async function createSchedule(data) {
    if (!data.author)
        return { success: false, message: 'Schedule Author not provided.' };

    if (!data.start_date)
        return { success: false, message: 'Schedule Start Date not provided.' };

    if (!data.end_date)
        return { success: false, message: 'Schedule End Date not provided.' };

    if (!(await getUser(data.author)))
        return { success: false, message: 'Specified Author User not found.' };

    if (!data.user_scope)
        return { success: false, message: 'Schedule User Scope not provided.' };

    if (!data.user_scope_id || isNaN(data.user_scope_id))
        return { success: false, message: 'Schedule User Scope ID not provided.' };

    const schedule = await Schedule.create({
        id: await randomId(Schedule),
        name: data.name || null,
        description: data.description || null,
        start_date: data.start_date,
        end_date: data.end_date,
        user_scope: data.user_scope,
        user_scope_id: data.user_scope_id,
        author: data.author
    });

    return { success: true, message: 'Schedule created successfully.', id: schedule.id };
}

/**
 * Updates an existing Schedule.
 * @param {number} id - Schedule ID
 * @param {Object} data - Schedule data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateSchedule(id, data) {
    if (!id)
        return { success: false, message: 'Schedule ID not provided.' };

    const schedule = await Schedule.findOne({ where: { id } });

    if (!schedule)
        return { success: false, message: 'Schedule not found.' };

    if (data.author && !(await getUser(data.author)))
        return { success: false, message: 'Specified Author User not found.' };

    await schedule.update(data);

    return { success: true, message: 'Schedule updated successfully.' };
}

/**
 * Deletes one or multiple Schedules and shifts included - if specified likewise.
 * @param {number|number[]} id - Single Schedule ID or array of Schedule IDs
 * @param {boolean} delete_shifts - optional - Should shifts within this Schedule be deleted. True by default.
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteSchedule(id, delete_shifts=true) {
    if (!isNumberOrNumberArray(id))
        return { success: false, message: `Invalid Schedule ID${Array.isArray(id) ? 's' : ''} provided.` };

    const transaction = await sequelize.transaction();

    try {
        if (delete_shifts)
            await Shift.destroy({ where: { schedule: id }, transaction });
        else
            await Shift.update({ schedule: null }, { where: { schedule: id } });

        const deletedCount = await Schedule.destroy({ where: { id }, transaction });

        if (!deletedCount) {
            await transaction.rollback();
            return {
                success: false,
                message: `No Schedules found to delete for provided ID${Array.isArray(id) && id.length > 1 ? 's' : ''}:
                 ${Array.isArray(id) ? id.join(', ') : id}`
            };
        }

        await transaction.commit();

        return {
            success: true,
            message: `${deletedCount} Schedule${deletedCount > 1 ? 's' : ''} deleted successfully.`,
            deletedCount
        };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
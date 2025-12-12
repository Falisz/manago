// BACKEND/controller/workPlanner/holidays.js
import {Op} from 'sequelize';
import {Holiday, HolidayWorking} from '#models';
import sequelize from '#utils/database';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';
import randomId from '#utils/randomId.js';

/**
 * Retrieves one Holiday by its ID or all Holidays if an ID is not provided.
 * @param {number|null} id - optional - Holiday ID to fetch a specific Holiday
 * @param {string} date - optional -
 * @param from
 * @param to
 * @param working - optional - User ID to fetch working status for a specific user on a specific date
 * @returns {Promise<Object|Object[]|null>} Single Holiday, array of Holidays, or null
 */
export async function getHoliday({id, date, from, to, working} = {}) {

    if (id) {
        const holiday = await Holiday.findByPk(id);

        if (holiday && working)
            holiday.working = await HolidayWorking.findOne({where: {holiday: id, user: working}, raw: true});

        return holiday;
    }

    const where = {};

    if (date)
        where.date = date;

    else if (from && to)
        where.date = {[Op.between]: [from, to]};

    else if (from)
        where.date = {[Op.gte]: from};

    else if (to)
        where.date = {[Op.lte]: to};

    const holidays = await Holiday.findAll({where, raw: true});

    if (holidays?.length && working) {
        const holidayIds = holidays.map(h => h.id);
        const workingStatuses = await HolidayWorking.findAll({
            where: {
                user: working,
                holiday: { [Op.in]: holidayIds}
            },
            raw: true
        });
        const workingMap = new Map(workingStatuses.map(status => [status.holiday, status]));
        holidays.forEach(holiday => {
            holiday.working = workingMap.get(holiday.id) || null;
        });
    }

    return holidays || [];
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
        return { success: false, message: 'Name is required to create a new Holiday!' };

    if (!data.date)
        return { success: false, message: 'Date is required to create a new Holiday!' };

    if (await Holiday.findOne({ where: { date: data.date }}))
        return { success: false, message: 'There currently is Holiday marked for the specified date.' };

    const holiday = await Holiday.create({
        id: await randomId(Holiday),
        name: data.name,
        date: data.date,
        requestable_working: data.requestable_working || true,
    });

    return { success: true, message: 'Holiday created successfully.', id: holiday.id };
}

/**
 * Updates an existing Holiday.
 * @param {number} id - Holiday ID
 * @param {Object} data - Holiday data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateHoliday(id, data) {
    if (!id)
        return { success: false, message: 'Holiday ID not provided.' };

    if (!data)
        return { success: false, message: 'Update data not provided.' };

    const holiday = await Holiday.findOne({ where: { id } });

    if (!holiday)
        return { success: false, message: 'Holiday not found.' };

    if (data.holiday && await Holiday.findOne({ where: { date: data.date }}))
        return { success: false, message: 'There currently is other Holiday marked for the specified date.' };

    await holiday.update(data);

    return { success: true, message: 'Holiday updated successfully.' };
}

/**
 * Deletes one or multiple Holidays and their assignments.
 * @param {number|number[]} id - Single Holiday ID or array of Holiday IDs
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteHoliday(id) {

    if (!isNumberOrNumberArray(id))
        return { success: false, message: `Invalid Holiday ID${Array.isArray(id) ? 's' : ''} provided.` };

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
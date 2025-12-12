// BACKEND/controller/workPlanner/Shift.js
import {JobLocation, JobPost, Schedule, Shift, User} from '#models';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';
import randomId from '#utils/randomId.js';
import {Op} from "sequelize";

// where fields start_time and end_time should have $gte and $lte operators respectively i.e.:
// { start_time: { $gte: '2023-10-01T00:00:00Z' }, end_time: { $lte: '2023-10-31T23:59:59Z' }, job_post: 2, schedule: 5, user: 10 }
/**
 * Retrieves one Shift by its ID or all Shifts if an ID is not provided.
 * @param {number|null} id - optional - Shift ID to fetch a specific Shift
 * @param user
 * @param job_post
 * @param schedule
 * @param date
 * @param from
 * @param to
 * @returns {Promise<Object|Object[]|null>} Single Shift, array of Shifts, or null
 */
export async function getShift({id, user, job_post, schedule, date, from, to} = {}) {

    const where = {};

    if (isNumberOrNumberArray(id))
        where.id = id;

    if (isNumberOrNumberArray(user))
        where.user = user;

    if (isNumberOrNumberArray(job_post))
        where.job_post = job_post;

    if (isNumberOrNumberArray(schedule) || schedule === null)
        where.schedule = schedule;

    if (date)
        where.date = date;

    else if (from && to)
        where.date = {[Op.between]: [from, to]};

    else if (from)
        where.date = {[Op.gte]: from};

    else if (to)
        where.date = {[Op.lte]: to};

    const include = [{ model: User, attributes: ['id', 'first_name', 'last_name']}, JobPost, JobLocation, Schedule ];

    const shifts = await Shift.findAll({ where, include });

    if (!shifts || shifts.length === 0)
        return [];

    return await Promise.all(shifts.map(async shift => {
        const rawData = shift.toJSON();

        rawData.user = shift['User'].toJSON();
        rawData.job_post = shift['JobPost']?.toJSON();
        rawData.schedule = shift['Schedule']?.toJSON();
        rawData.job_location = shift['JobLocation']?.toJSON();

        delete rawData['User'];
        delete rawData['JobPost'];
        delete rawData['Schedule'];
        delete rawData['JobLocation'];

        return rawData;
    }));
}

/**
 * Creates a new Shift.
 * @param {Object} data - Shift data
 * @param {number} data.user - Shift User ID
 * @param {number} data.date - Shift date
 * @param {string} data.start_time - Shift start time
 * @param {string} data.end_time - Shift end time
 * @param {number} data.job_post - optional - Shift Job Post ID
 * @param {number} data.schedule - optional - Shift Schedule ID
 * @param {string} data.note - optional - Shift note
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createShift(data) {
    // 1. Required fields
    if (!data.user)
        return { success: false, message: 'User is required.' };

    if (!data.date)
        return { success: false, message: 'Date is required.' };

    if (!data.start_time)
        return { success: false, message: 'Start time is required.' };

    if (!data.end_time)
        return { success: false, message: 'End time is required.' };

    // 2. Validate foreign keys (parallel)
    const [user, jobPost, schedule] = await Promise.all([
        User.findByPk(data.user),
        data.job_post ? JobPost.findByPk(data.job_post.id || data.job_post) : Promise.resolve(null),
        data.schedule ? Schedule.findByPk(data.schedule) : Promise.resolve(null),
    ]);

    if (!user)
        return { success: false, message: 'User not found.' };
    if (data.job_post && !jobPost)
        return { success: false, message: 'Job Post not found.' };
    if (data.schedule && !schedule)
        return { success: false, message: 'Schedule not found.' };

    // 3. Validate date (DATEONLY)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date))
        return { success: false, message: 'Invalid date format. Use YYYY-MM-DD.' };

    // 4. Validate time format (HH:mm or HH:mm:ss)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(data.start_time))
        return { success: false, message: 'Invalid start time format. Use HH:mm or HH:mm:ss.' };
    if (!timeRegex.test(data.end_time))
        return { success: false, message: 'Invalid end time format. Use HH:mm or HH:mm:ss.' };

    const shift = await Shift.create({
        id: await randomId(Shift),
        user: data.user,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        job_post: data.job_post?.id || data.job_post || null,
        schedule: data.schedule || null,
        note: data.note || null
    });

    return { success: true, message: 'Shift created successfully.', id: shift.id };
}

/**
 * Updates an existing Shift.
 * @param {number} id - Shift ID
 * @param {Object} data - Shift data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateShift(id, data) {
    if (!id)
        return { success: false, message: 'Shift ID not provided.' };

    if (!data)
        return { success: false, message: 'Update data not provided.' };

    const shift = await Shift.findByPk(id);

    if (!shift)
        return { success: false, message: 'Shift not found.' };

    const updates = {};

    // === Optional: user ===
    if (data.user !== undefined) {
        const user = await User.findByPk(data.user);
        if (!user) return { success: false, message: 'User not found.' };
        updates.user = data.user;
    }

    // === Optional: date ===
    if (data.date !== undefined) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date))
            return { success: false, message: 'Invalid date format. Use YYYY-MM-DD.' };
        updates.date = data.date;
    }

    // === Optional: start_time ===
    if (data.start_time !== undefined) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
        if (!timeRegex.test(data.start_time))
            return { success: false, message: 'Invalid start time format.' };
        updates.start_time = data.start_time;
    }

    // === Optional: end_time ===
    if (data.end_time !== undefined) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
        if (!timeRegex.test(data.end_time))
            return { success: false, message: 'Invalid end time format.' };
        updates.end_time = data.end_time;
    }

    // === Time comparison (only if both times are being updated or one is) ===
    if (updates.start_time || updates.end_time) {
        const finalStart = updates.start_time || shift.start_time;
        const finalEnd = updates.end_time || shift.end_time;

        if (finalStart >= finalEnd)
            return { success: false, message: 'Start time must be before end time.' };
    }

    // === Optional: job_post ===
    if (data.job_post !== undefined) {
        if (data.job_post !== null) {
            const jobPost = await JobPost.findByPk(data.job_post.id || data.job_post);
            if (!jobPost)
                return { success: false, message: 'Job Post not found.' };
        }
        updates.job_post = data.job_post?.id || data.job_post || null;
    }

    // === Optional: schedule ===
    if (data.schedule !== undefined) {
        if (data.schedule !== null) {
            const schedule = await Schedule.findByPk(data.schedule);
            if (!schedule) return { success: false, message: 'Schedule not found.' };
        }
        updates.schedule = data.schedule;
    }

    if (data.note !== undefined)
        updates.note = data.note;

    await shift.update(updates);

    return { success: true, message: 'Shift updated successfully.' };
}

/**
 * Deletes one or multiple Shifts.
 * @param {number|number[]} id - Single Shift ID or array of Shift IDs
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteShift(id) {
    if (!isNumberOrNumberArray(id))
        return { success: false, message: `Invalid Shift ID${Array.isArray(id) ? 's' : ''} provided.` };

    const deletedCount = await Shift.destroy({ where: { id } });

    if (!deletedCount)
        return {
            success: false,
            message: `No Shifts found to delete for provided ID${Array.isArray(id) && id.length > 1 ? 's' : ''}:
                ${Array.isArray(id) ? id.join(', ') : id}`
        };

    return {
        success: true,
        message: `${deletedCount} Shift${deletedCount > 1 ? 's' : ''} deleted successfully.`,
        deletedCount
    };
}
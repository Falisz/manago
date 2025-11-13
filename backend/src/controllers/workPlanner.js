// BACKEND/controller/workPlanner.js
import { 
    Shift, 
    JobPost, 
    Schedule, 
    Holiday, 
    LeaveType, 
    Leave, 
    RequestStatus, 
    HolidayWorking,  
    WeekendWorking,
    Disposition,
    DispositionPreset
} from '../models/workPlanner.js';
import { User } from '../models/users.js';
import {getUser, getUsersByScope} from './users.js';
import { Op } from 'sequelize';
import randomId from '../utils/randomId.js';
import isNumberOrNumberArray from '../utils/isNumberOrNumberArray.js';
import sequelize from '../utils/database.js';

// Schedules
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

        const users = await getUsersByScope({
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

        schedule.leaves = await getLeave({
            user: users.map(user => user.id)
        });

        return schedule;

    }
        
    // Logic if no ID is provided - fetch all Schedules
    if (!id || isNaN(id)) {
        
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
            schedules.map( async (schedule) => await extendSchedule(schedule) )
        );
    }

    // Logic if the ID is provided - fetch a specific Schedule
    const schedule = await Schedule.findOne({where: { id }, raw: true});

    if (!schedule) 
        return null;

    return await extendSchedule(schedule);
}

/**
 * Creates a new Schedule.
 * @param {Object} data - Schedule data
 * @param {string} data.name - optional - Schedule name
 * @param {string} data.description - optional - Schedule description
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
        const deletedCount = await Schedule.destroy({ where: { id }, transaction });

        if (!deletedCount) {
            await transaction.rollback();
            return { 
                success: false, 
                message: `No Schedules found to delete for provided ID${Array.isArray(id) && id.length > 1 ? 's' : ''}:
                 ${Array.isArray(id) ? id.join(', ') : id}` 
            };
        }

        if (delete_shifts)
            await Shift.destroy({ where: { schedule: id }, transaction });
        
        else
            await Shift.update({ schedule: null }, { where: { schedule: id } });

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

// JobPosts
/**
 * Retrieves one Job Post by its ID or all Job Posts if an ID is not provided.
 * @param {number|null} id - optional - Job Post ID to fetch a specific Job Post
 * @param {boolean} include_shifts - optional - Should there be shifts included for this fetched Job Post? False by default.
 * @returns {Promise<Object|Object[]|null>} Single Job Post, array of Job Posts, or null
 */
export async function getJobPost({id, include_shifts=false} = {}) {
        
    // Logic if no ID is provided - fetch all Job Posts
    if (!id || isNaN(id)) {
        const jobPosts = await JobPost.findAll({ raw: true });

        if (!jobPosts || jobPosts.length === 0)
            return [];

        return await Promise.all(jobPosts.map(async jobPost => {
            if (include_shifts)
                jobPost.shifts = await getShift({job_post: jobPost.id});

            return jobPost;
        }))

    }

    // Logic if the ID is provided - fetch a specific Job Post
    const jobPost = await JobPost.findOne({where: {id}, raw: true});

    if (!jobPost)
        return null;

    if (include_shifts)
        jobPost.shifts = await getShift({job_post: jobPost.id});
        
    return jobPost;
}

/**
 * Creates a new Job Post.
 * @param {Object} data - Job Post data
 * @param {string} data.name - Job Post name
 * @param {string} data.color - optional - Job Post color
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createJobPost(data) {
    if (!data.name)
        return { success: false, message: 'Job Post name is required.' };

    if (await JobPost.findOne({ where: { name: data.name } }))
        return { success: false, message: 'There already is a Job Post with provided name. Use different one.' }

    const jobPost = JobPost.create({
        id: await randomId(JobPost),
        name: data.name || null,
        color: data.color || null
    });

    return { success: true, message: 'Job Post created successfully.', id: jobPost.id };
}

/**
 * Updates an existing Job Post.
 * @param {number} id - Job Post ID
 * @param {Object} data - Job Post data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateJobPost(id, data) {
    if (!id)
        return { success: false, message: 'Job Post ID not provided.' };
    
    const jobPost = await JobPost.findOne({ where: { id } });

    if (!jobPost)
        return { success: false, message: 'Job Post not found.' };

    if (data.name && await JobPost.findOne({ where: { name: data.name } }))
        return { success: false, message: 'There already is a Job Post with provided name. Use different one.' };

    await jobPost.update(data);
    
    return { success: true, message: 'Job Post updated successfully.' };
}

/**
 * Deletes one or multiple Job Post and shifts included - if specified likewise.
 * @param {number|number[]} id - Single Job Post ID or array of Job Post IDs
 * @param {boolean} delete_shifts - optional - Should shifts within this Schedule be deleted. False by default.
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteJobPost({id, delete_shifts=false} = {}) {
    if (!isNumberOrNumberArray(id))
        return { success: false, message: `Invalid Job Post ID${Array.isArray(id) ? 's' : ''} provided.` };

    const transaction = await sequelize.transaction();
    
    try {
        const deletedCount = await JobPost.destroy({ where: { id }, transaction });

        if (!deletedCount) {
            await transaction.rollback();
            return { 
                success: false, 
                message: `No Job Posts found to delete for provided ID${Array.isArray(id) && id.length > 1 ? 's' : ''}:
                 ${Array.isArray(id) ? id.join(', ') : id}` 
            };
        }

        if (delete_shifts)
            await Shift.destroy({ where: { job_post: id }, transaction });
        
        else
            await Shift.update({ job_post: null }, { where: { job_post: id } });

        await transaction.commit();

        return { 
            success: true, 
            message: `${deletedCount} Job Post${deletedCount > 1 ? 's' : ''} deleted successfully.`,
            deletedCount 
        };
    
    } catch (error) {
        await transaction.rollback();
        throw error;

    }
}

// Shifts
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

    const include = [{ model: User, attributes: ['id', 'first_name', 'last_name']}, JobPost, Schedule ];

    const shifts = await Shift.findAll({ where, include });

    if (!shifts || shifts.length === 0)
        return [];

    return await Promise.all(shifts.map(async shift => {
        const rawData = shift.toJSON();

        rawData.user = shift['User'].toJSON();
        rawData.job_post = shift['JobPost']?.toJSON();
        rawData.schedule = shift['Schedule']?.toJSON();

        delete rawData['User'];
        delete rawData['JobPost'];
        delete rawData['Schedule'];

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

    const shift = Shift.create({
        id: await randomId(Shift),
        user: data.user,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        job_post: data.job_post?.id || data.job_post || null,
        schedule: data.schedule || null
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

// Holidays
/**
 * Retrieves one Holiday by its ID or all Holidays if an ID is not provided.
 * @param {number|null} id - optional - Holiday ID to fetch a specific Holiday
 * @param {string} date - optional -
 * @returns {Promise<Object|Object[]|null>} Single Holiday, array of Holidays, or null
 */
export async function getHoliday({id, date} = {}) {
    if (!id)         
        return await Holiday.findAll({ where: { date } }) || {};

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

    const holiday = await Holiday.findOne({ where: { id } });

    if (!holiday)
        return { success: false, message: 'Role not found.' };

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

// Leave Types
/**
 * Retrieves one Leave Type by its ID or all Leave Types if an ID is not provided.
 * @param {number|null} id - optional - Leave Type ID to fetch a specific Leave Type
 * @returns {Promise<Object|Object[]|null>} Single Leave Type, array of Leave Types, or null
 */
export async function getLeaveType({id} = {}) {
    if (!id || isNaN(id)) 
        return await LeaveType.findAll({ raw: true });

    return await LeaveType.findOne({ where: {id}, raw: true });
}

/**
 * Creates a new Leave Type.
 * @param {Object} data - Leave Type data
 * @param {string} data.name - Leave Type name
 * @param {string} data.parent_type -
 * @param {string} data.amount -
 * @param {string} data.color -
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createLeaveType(data) {
    if (!data.name)
        return { success: false, message: 'Leave Type name is required.' };
    
    if (await LeaveType.findOne({ where: { name: data.name } }))
        return { success: false, message: 'Leave Type name is currently used.' };

    if (data.parent_type && !(await LeaveType.findOne({ where: { id: data.parent_type}})))
        return { success: false, message: 'Parent Leave Type not found.'};

    if (data.amount && isNaN(data.amount))
        return { success: false, message: 'Leave amount must be a number.'};
    
    const type = await LeaveType.create({
        id: await randomId(LeaveType),
        name: data.name,
        parent_type: data.parent_type || null,
        amount: data.amount || null,
        color: data.color || null
    });

    return { success: true, message: 'LeaveType created successfully.', id: type.id };
}

/**
 * Updates an existing Leave Type.
 * @param {number} id - Leave Type ID
 * @param {Object} data - Leave Type data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateLeaveType(id, data) {
    if (!id) 
        return { success: false, message: 'LeaveType ID not provided.' };
    
    const leaveType = await LeaveType.findOne({ where: { id } });
    
    if (!leaveType)
        return { success: false, message: 'LeaveType not found.' };
    
    if (data.name && await LeaveType.findOne({ where: { name: data.name } }))
        return { success: false, message: 'Name provided is currently used by other Leave Type.' };

    if (data.parent_type && !(await LeaveType.findOne({ where: { id: data.parent_type}})))
        return { success: false, message: 'Provided parent Leave Type not found.'};

    if (data.amount && isNaN(data.amount))
        return { success: false, message: 'Leave amount must be a number.'};
    
    await leaveType.update(data);

    return { success: true, message: 'Leave Type updated successfully.' };
}

/**
 * Deletes one or multiple Leave Types and their assignments.
 * @param {number|number[]} id - Single Leave Type ID or array of Leave Type IDs
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteLeaveType(id) {
    if (!isNumberOrNumberArray(id)) 
        return { success: false, message: 'Invalid Leave Type ID(s) provided.' };
    
    const deleted = await LeaveType.destroy({ where: { id } });
    
    if (!deleted) 
        return { success: false, message: 'No Leave Types found to delete.' };
    
    return { 
        success: true, 
        message: `${deleted} Leave Type${deleted > 1 ? 's' : ''} deleted successfully.`, 
        deletedCount: deleted 
    };
}

// Leaves
/**
 * Retrieves one Leave by its ID or all Leaves if an ID is not provided.
 * @param {number|null} id - optional - Leave ID to fetch a specific Leave
 * @param {number|number[]|null} user - optional - User ID or array of User IDs for which Leaves should be fetched
 * @param {number|number[]|null} approver - optional - Approver User ID or array of Approver User IDs for which Leaves should be fetched
 * @param date
 * @param start_date
 * @param end_date
 * @returns {Promise<Object|Object[]|null>} Single Leave, array of Leaves, or null
 */
export async function getLeave({id, user, approver, date, start_date, end_date} = {}) {

    const where = {};

    if (isNumberOrNumberArray(id))
        where.id = id;

    if (isNumberOrNumberArray(user))
        where.user = user;

    if (isNumberOrNumberArray(approver))
        where.approver = approver;

    if (date) {        
        where.start_date = { [Op.gte]: date };
        where.end_date = { [Op.lte]: date };

    } else {
        if (start_date)
            where.start_date = {[Op.gte]: start_date};

        if (end_date)
            where.end_date = {[Op.lte]: end_date};
    }

    const include = [
        { model: User, attributes: ['id', 'first_name', 'last_name'] }, 
        { model: User, attributes: ['id', 'first_name', 'last_name'], as: 'Approver' },
        { model: LeaveType, attributes: ['name', 'color'] }
    ];

    const leaves = await Leave.findAll({ where, include });

    if (!leaves || leaves.length === 0)
        return [];

    return await Promise.all(leaves.map(async leave => {
        const rawData = leave.toJSON();

        rawData.user = leave['User'].toJSON();
        rawData.approveer = leave['Approver']?.toJSON();
        rawData.type = leave['LeaveType']?.name;
        rawData.color = leave['LeaveType']?.color;

        delete rawData['User'];
        delete rawData['Approver'];
        delete rawData['LeaveType'];

        return rawData;
    }));
}

/**
 * Creates a new Leave.
 * @param {Object} data - Leave data
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createLeave(data) {
    if (!data.type)
        return { success: false, message: 'Leave Type not provided.'};

    if (!data.user)
        return { success: false, message: 'User requesting a Leave not provided.'};

    if (!data.start_date || !data.end_date || !data.days)
        return { 
            success: false,
            message: `Leaves time range not provided. 
            (start_date: ${data.start_date}, end_date: ${data.end_date}, days: ${data.days})` 
        };
    
    if (!(await LeaveType.findOne({ where: { id: data.type } })))
        return { success: false, message: 'Leave Type not found.' };
    
    if (!(await RequestStatus.findOne({ where: { id: data.status } }))) 
        return { success: false, message: 'Request Status not found.' };
    
    if (!(await User.findOne({ where: { id: data.user } }))) 
        return { success: false, message: 'User not found.' };
    
    if (data.approver && !(await User.findOne({ where: { id: data.approver } }))) 
        return { success: false, message: 'Approver not found.' };
    

    const leave = await Leave.create({
        id: await randomId(Leave),
        type: data.type,
        start_date: data.start_date,
        end_date: data.end_date,
        days: data.days,
        status: data.status || 0,
        user: data.user,
        approver: data.approver || null,
        user_note: data.user_note || null,
        approver_note: data.approver_note || null
    });

    return { success: true, message: 'Leave created successfully.', id: leave.id };
}

/**
 * Updates an existing Leave.
 * @param id
 * @param {Object} data - Leave data
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function updateLeave(id, data) {
    if (!id)
        return { success: false, message: 'Leave ID not provided.' };
    
    const leave = await Leave.findOne({ where: { id } });
    
    if (!leave)
        return { success: false, message: 'Leave not found.' };

    if (data.type && !(await LeaveType.findOne({ where: { id: data.type } })))
        return { success: false, message: 'Leave Type not found.' };

    if (data.status && !(await RequestStatus.findOne({ where: { id: data.status } }))) 
        return { success: false, message: 'Request Status not found.' };
    
    if (data.user && !(await User.findOne({ where: { id: data.user } }))) 
        return { success: false, message: 'User not found.' };
    
    if (data.approver && !(await User.findOne({ where: { id: data.approver } }))) 
        return { success: false, message: 'Approver not found.' };
    
    await leave.update(data);

    return { success: true, message: 'Leave updated successfully.' };
}

/**
 * Deletes a Leave.
 * @param {number|number[]} id - Single Shift ID or array of Shift IDs
 * @returns {Promise<{success: boolean, message: string, deletedCount: number}>}
 */
export async function deleteLeave(id) {
    if (!isNumberOrNumberArray(id)) 
        return { success: false, message: 'Invalid Leave ID(s) provided.' };
    
    const deleted = await Leave.destroy({ where: { id } });
    
    if (!deleted)
        return { success: false, message: 'No Leaves found to delete.' };
    
    return { 
        success: true, 
        message: `${deleted} Leave${deleted > 1 ? 's' : ''} deleted successfully.`,
        deletedCount: deleted
    };
}

// Request Statuses
export async function getRequestStatus({id} = {}) {
    if (!id || isNaN(id)) {
        const statuses = await RequestStatus.findAll({ raw: true });
        if (!statuses || statuses.length === 0) return [];
        return statuses;
    }
    return await RequestStatus.findByPk(id) || null;
}

export async function createRequestStatus(data) {
    if (!data.name) {
        return { success: false, message: 'Mandatory data not provided.' };
    }
    const status = await RequestStatus.create({
        id: await randomId(RequestStatus),
        name: data.name
    });
    return { success: true, message: 'RequestStatus created successfully.', id: status.id };
}

export async function updateRequestStatus(id, data) {
    if (!id) return { success: false, message: 'RequestStatus ID not provided.' };
    const status = await RequestStatus.findOne({ where: { id } });
    if (!status) return { success: false, message: 'RequestStatus not found.' };
    await status.update(data);
    return { success: true, message: 'RequestStatus updated successfully.' };
}

export async function deleteRequestStatus(id) {
    if (!isNumberOrNumberArray(id)) return { success: false, message: 'Invalid RequestStatus ID(s) provided.' };
    const deleted = await RequestStatus.destroy({ where: { id } });
    if (!deleted) return { success: false, message: 'No RequestStatuses found to delete.' };
    return { success: true, message: `${deleted} RequestStatus${deleted > 1 ? 'es' : ''} deleted successfully.`, deletedCount: deleted };
}

// Holiday Working
export async function getHolidayWorking({id} = {}) {
    if (!id || isNaN(id)) {
        const workings = await HolidayWorking.findAll({ raw: true });
        if (!workings || workings.length === 0) return [];
        return workings;
    }
    return await HolidayWorking.findByPk(id) || null;
}

export async function createHolidayWorking(data) {
    if (!data.holiday || !data.status || !data.user)
        return { success: false, message: 'Mandatory data not provided.' };

    if (!(await Holiday.findOne({ where: { id: data.holiday } })))
        return { success: false, message: 'Holiday not found.' };

    if (!(await RequestStatus.findOne({ where: { id: data.status } })))
        return { success: false, message: 'Request Status for Holiday Working not found.' };

    if (!(await User.findOne({ where: { id: data.user } })))
        return { success: false, message: 'User for Holiday Working not found.' };

    const working = await HolidayWorking.create({
        id: await randomId(HolidayWorking),
        holiday: data.holiday,
        status: data.status,
        user: data.user,
        approver: data.approver || null,
        user_note: data.user_note || null,
        approver_note: data.approver_note || null
    });
    return { success: true, message: 'HolidayWorking created successfully.', id: working.id };
}

export async function updateHolidayWorking(id, data) {
    if (!id) return { success: false, message: 'HolidayWorking ID not provided.' };
    const working = await HolidayWorking.findOne({ where: { id } });
    if (!working) return { success: false, message: 'HolidayWorking not found.' };
    if (data.holiday && !(await Holiday.findOne({ where: { id: data.holiday } }))) {
        return { success: false, message: 'Holiday not found.' };
    }
    if (data.status && !(await RequestStatus.findOne({ where: { id: data.status } }))) {
        return { success: false, message: 'RequestStatus not found.' };
    }
    if (data.user && !(await User.findOne({ where: { id: data.user } }))) {
        return { success: false, message: 'User not found.' };
    }
    if (data.approver && !(await User.findOne({ where: { id: data.approver } }))) {
        return { success: false, message: 'Approver not found.' };
    }
    await working.update(data);
    return { success: true, message: 'HolidayWorking updated successfully.' };
}

export async function deleteHolidayWorking(id) {
    if (!isNumberOrNumberArray(id)) return { success: false, message: 'Invalid HolidayWorking ID(s) provided.' };
    const deleted = await HolidayWorking.destroy({ where: { id } });
    if (!deleted) return { success: false, message: 'No HolidayWorkings found to delete.' };
    return { success: true, message: `${deleted} HolidayWorking${deleted > 1 ? 's' : ''} deleted successfully.`, deletedCount: deleted };
}

// Weekend Working
export async function getWeekendWorking({id} = {}) {
    if (!id || isNaN(id)) {
        const workings = await WeekendWorking.findAll({ raw: true });
        if (!workings || workings.length === 0) return [];
        return workings;
    }
    return await WeekendWorking.findByPk(id) || null;
}

export async function createWeekendWorking(data) {
    if (!data.date || !data.status || !data.user)
        return { success: false, message: 'Mandatory data not provided.' };

    if (!(await RequestStatus.findOne({ where: { id: data.status } })))
        return { success: false, message: 'Request Status for Weekend Working not found.' };

    if (!(await User.findOne({ where: { id: data.user } })))
        return { success: false, message: 'User for Weekend Working not found.' };

    const working = await WeekendWorking.create({
        id: await randomId(WeekendWorking),
        date: data.date,
        status: data.status,
        user: data.user,
        approver: data.approver || null,
        user_note: data.user_note || null,
        approver_note: data.approver_note || null
    });
    return { success: true, message: 'Weekend Working created successfully.', id: working.id };
}

export async function updateWeekendWorking(id, data) {
    if (!id)
        return { success: false, message: 'WeekendWorking ID not provided.' };

    const working = await WeekendWorking.findOne({ where: { id } });

    if (!working)
        return { success: false, message: 'WeekendWorking not found.' };

    if (data.status && !(await RequestStatus.findOne({ where: { id: data.status } })))
        return { success: false, message: 'Request Status for Weekend Working not found.' };

    if (data.user && !(await User.findOne({ where: { id: data.user } })))
        return { success: false, message: 'User for Weekend Working not found.' };

    if (data.approver && !(await User.findOne({ where: { id: data.approver } })))
        return { success: false, message: 'Approver for Weekend Working not found.' };

    await working.update(data);

    return { success: true, message: 'WeekendWorking updated successfully.' };
}

export async function deleteWeekendWorking(id) {
    if (!isNumberOrNumberArray(id)) return { success: false, message: 'Invalid WeekendWorking ID(s) provided.' };
    const deleted = await WeekendWorking.destroy({ where: { id } });
    if (!deleted) return { success: false, message: 'No WeekendWorkings found to delete.' };
    return { success: true, message: `${deleted} WeekendWorking${deleted > 1 ? 's' : ''} deleted successfully.`, deletedCount: deleted };
}

// Disposition Presets
export async function getDispositionPreset({id} = {}) {
    if (!id || isNaN(id))
        return await DispositionPreset.findAll({ raw: true });

    return await DispositionPreset.findByPk(id) || null;
}

export async function createDispositionPreset(data) {
    if (!data.name || !data.start_time || !data.end_time)
        return { success: false, message: 'Mandatory data not provided.' };

    const preset = await DispositionPreset.create({
        id: await randomId(DispositionPreset),
        name: data.name,
        start_time: data.start_time,
        end_time: data.end_time,
        color: data.color || null
    });

    return { success: true, message: 'Disposition Preset created successfully.', id: preset.id };
}

export async function updateDispositionPreset(id, data) {
    if (!id) 
        return { success: false, message: 'Disposition Preset ID not provided.' };

    const preset = await DispositionPreset.findOne({ where: { id } });

    if (!preset) 
        return { success: false, message: 'Disposition Preset not found.' };

    await preset.update(data);

    return { success: true, message: 'Disposition Preset updated successfully.' };
}

export async function deleteDispositionPreset(id) {
    if (!isNumberOrNumberArray(id)) 
        return { success: false, message: 'Invalid Disposition Preset ID(s) provided.' };

    const deleted = await DispositionPreset.destroy({ where: { id } });

    if (!deleted) 
        return { success: false, message: 'No Disposition Presets found to delete.' };

    return { 
        success: true, 
        message: `${deleted} Disposition Preset${deleted > 1 ? 's' : ''} deleted successfully.`, 
        deletedCount: deleted 
    };
}

// Dispositions
export async function getDisposition({id, user, date} = {}) {
    if (!id || isNaN(id)) {
        const where = {};

        if (user)
            where.user = user;

        if (date) {
            const startOfDay = `${date} 00:00:00`;
            const endOfDay = `${date} 23:59:59`;
            where.start_time = { [Op.gte]: startOfDay };
            where.end_time = { [Op.lte]: endOfDay };
        }

        return await Disposition.findAll({ raw: true, where });
    }

    return await Disposition.findByPk(id) || null;
}

export async function createDisposition(data) {
    if (!data.user || !data.start_time || !data.end_time)
        return { success: false, message: 'Mandatory data not provided.' };
    
    if (!(await User.findOne({ where: { id: data.user } }))) 
        return { success: false, message: 'User not found.' };
    
    if (data.preset && !(await DispositionPreset.findOne({ where: { id: data.preset } }))) 
        return { success: false, message: 'Disposition Preset not recognised.' };
    
    const disposition = await Disposition.create({
        id: await randomId(Disposition),
        user: data.user,
        start_time: data.start_time,
        end_time: data.end_time,
        preset: data.preset || null,
        notes: data.notes || null
    });
    
    return { success: true, message: 'Disposition created successfully.', id: disposition.id };
}

export async function updateDisposition(id, data) {
    if (!id) 
        return { success: false, message: 'Disposition ID not provided.' };

    const disposition = await Disposition.findOne({ where: { id } });

    if (!disposition) 
        return { success: false, message: 'Disposition not found.' };

    if (data.user && !(await User.findOne({ where: { id: data.user } })))
        return { success: false, message: 'User not found.' };
    
    if (data.preset && !(await DispositionPreset.findOne({ where: { id: data.preset } }))) 
        return { success: false, message: 'Disposition Preset not found.' };
    
    await disposition.update(data);

    return { success: true, message: 'Disposition updated successfully.' };
}

export async function deleteDisposition(id) {
    if (!isNumberOrNumberArray(id)) 
        return { success: false, message: 'Invalid Disposition ID(s) provided.' };

    const deleted = await Disposition.destroy({ where: { id } });

    if (!deleted) 
        return { success: false, message: 'No Dispositions found to delete.' };
    
    return { 
        success: true, 
        message: `${deleted} Disposition${deleted > 1 ? 's' : ''} deleted successfully.`, 
        deletedCount: deleted 
    };
}
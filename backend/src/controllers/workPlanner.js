// BACKEND/controller/workPlanner.js
import { 
    Shift, 
    JobPost, 
    Schedule, 
    Holiday, 
    LeavePool,
    LeaveType, 
    Leave, 
    RequestStatus, 
    HolidayWorking,  
    WeekendWorking,
    Disposition,
    DispositionPreset
} from '../models/workPlanner.js';
import { User } from '../models/users.js';
import { getUser } from './users.js';
import { Op } from 'sequelize';
import randomId from "../utils/randomId.js";
import isNumberOrNumberArray from "../utils/isNumberOrNumberArray.js";
import sequelize from "../utils/database.js";

// Schedules
/**
 * Retrieves one Working Schedule by its ID or all Schedules if an ID is not provided.
 * @param {number|null} id - optional - Schedule ID to fetch a specific Schedule
 * @param {number|null} author - optional - User ID(s) to fetch Schedules authored by that User(s)
 * @param {boolean} include_shifts - optional - Should there be shifts included for this fetched Schedule(s)? False by default.
 * @returns {Promise<Object|Object[]|null>} Single Schedule, array of Schedules, or null
 */
export async function getSchedule({id, author=null, include_shifts=false} = {}) {
        
    // Logic if no ID is provided - fetch all Schedules
    if (!id || isNaN(id)) {
        
        const where = {};

        if (author) 
            where.author = author;

        const schedules = await Schedule.findAll({ where, raw: true });

        if (!schedules || schedules.length === 0) 
            return [];

        return await Promise.all(schedules.map(async schedule => {
            if (include_shifts) schedule.shifts = await getShift({schedule: schedule.id});
            return schedule;
        }));
    }

    // Logic if the ID is provided - fetch a specific Schedule
    const schedule = await Schedule.findOne({where: { id }, raw: true});

    if (!schedule) 
        return null;

    if (include_shifts) schedule.shifts = await getShift({schedule: schedule.id});
        
    return schedule;
}

/**
 * Creates a new Schedule.
 * @param {Object} data - Schedule data
 * @param {string} data.name - optional - Schedule name
 * @param {string} data.description - optional - Schedule description
 * @param {number} data.author - User ID of Schedule author
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createSchedule(data) {
    if (!data.author) 
        return { success: false, message: 'Schedule Author not provided.' }

    if (!(await getUser(data.author))) 
        return { success: false, message: 'Specified Author User not found.' }

    const schedule = Schedule.create({
        id: await randomId(Schedule),
        name: data.name || null,
        description: data.description || null,
        author: data.author
    });

    return { success: true, message: 'Schedule created succesffully.', id: schedule.id };
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
        return { success: false, message: 'Specified Author User not found.' }

    await schedule.update(data);
    
    return { success: true, message: 'Schedule updated succesffully.' }
}

/**
 * Deletes one or multiple Schedules and shifts included - if specified likewise.
 * @param {number|number[]} id - Single Schedule ID or array of Schedule IDs
 * @param {boolean} delete_shifts - optional - Should shifts within this Schedule be deleted. True by default.
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteSchedule({id, delete_shifts=true} = {}) {
    if (!isNumberOrNumberArray(id))
        return { success: false, message: `Invalid Schedule ID${Array.isArray(id) ? 's' : ''} provided.` };

    const transaction = await sequelize.transaction();
    
    try {
        const deleted = await Schedule.destroy({ where: { id }, transaction });

        if (!deleted) {
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
            await Shift.update({ schedule: null }, { where: { scheudle: id } });

        await transaction.commit();

        return { 
            success: true, 
            message: `${deleted} Schedule${deleted > 1 ? 's' : ''} deleted successfully.`,
            deletedCount: deleted 
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
 * @param {string} data.name -  Job Post name
 * @param {string} data.color - optional - Job Post color
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createJobPost(data) {
    if (!data.name)
        return {
            success: false,
            message: 'Job Post name is required.'
        }

    if (await JobPost.findOne({ where: { name: data.name } }))
        return {
            success: false,
            message: 'There already is a Job Post with provided name. Use different one.'
        }

    const jobPost = JobPost.create({
        id: await randomId(JobPost),
        name: data.name || null,
        color: data.color || null
    });

    return {
        success: true,
        message: 'Job Post created succesffully.',
        id: jobPost.id
    };
}

/**
 * Updates an existing Job Post.
 * @param {number} id - Job Post ID
 * @param {Object} data - Job Post data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateJobPost(id, data) {
    if (!id)
        return {
            success: false, 
            message: 'Job Post ID not provided.'
        };
    
    const jobPost = await JobPost.findOne({ where: { id } });

    if (!jobPost)
        return {
            success: false, 
            message: 'Job Post not found.'
        };

    if (data.name && await JobPost.findOne({ where: { name: data.name } }))
        return {
            success: false,
            message: 'There already is a Job Post with provided name. Use different one.'
        }

    await jobPost.update(data);
    
    return {
        success: true,
        message: 'Job Post updated succesffully.'
    }
}

/**
 * Deletes one or multiple Job Post and shifts included - if specified likewise.
 * @param {number|number[]} id - Single Job Post ID or array of Job Post IDs
 * @param {boolean} delete_shifts - optional - Should shifts within this Schedule be deleted. False by default.
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteJobPost({id, delete_shifts=false} = {}) {
    if (!isNumberOrNumberArray(id))
        return { 
            success: false, 
            message: `Invalid Job Post ID${Array.isArray(id) ? 's' : ''} provided.` 
        };

    const transaction = await sequelize.transaction();
    
    try {
        const deletedJobPosts = await JobPost.destroy({ where: { id }, transaction });

        if (!deletedJobPosts) {
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
            message: `${deletedJobPosts} Job Post${deletedJobPosts > 1 ? 's' : ''} deleted successfully.`,
            deletedCount: deletedJobPosts 
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
 * @returns {Promise<Object|Object[]|null>} Single Shift, array of Shifts, or null
 */
export async function getShift({id, user, job_post, schedule, start_time, end_time} = {}) {

    const where = {};

    if (isNumberOrNumberArray(id))
        where.id = id;

    if (isNumberOrNumberArray(user))
        where.user = user;

    if (isNumberOrNumberArray(job_post))
        where.job_post = job_post;

    if (isNumberOrNumberArray(schedule))
        where.schedule = schedule;

    if (start_time)
        where.start_time = {[Op.gte]: start_time};

    if (end_time)
        where.end_time = {[Op.lte]: end_time};

    const include = [{model: User, attributes: ['id', 'first_name', 'last_name']}, JobPost, Schedule];

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
 * @param {number} data.user -  Shift User ID
 * @param {string} data.start_time -  Shift start time
 * @param {string} data.end_time - Shift end time
 * @param {number} data.job_post - optional - Shift Job Post ID
 * @param {number} data.schedule - optional - Shift Schedule ID
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createShift(data) {
    if (!data.user)
        return {
            success: false,
            message: 'User is required to create a new shift.'
        }

    if (!(await getUser(data.author)))
        return {
            success: false,
            message: 'Specified Shift User not found.'
        }

    if (!data.start_time)
        return {
            success: false,
            message: 'Start time must be provided.'
        }

    data.start_time = new Date(data.start_time);

    if (!(data.start_time instanceof Date && isNaN(data.start_time)))
        return {
            success: false,
            message: 'Invalid start time of the shift provided.'
        }
        
    if (!data.end_time)
        return {
            success: false,
            message: 'End time must be provided.'
        }

    data.end_time = new Date(data.end_time);

    if (!(data.end_time instanceof Date && isNaN(data.end_time)))
        return {
            success: false,
            message: 'Invalid end time of the shift provided.'
        }

    if (data.start_time > data.end_time)
        return {
            success: false,
            message: 'Start time cannot be greater than an end time.'
        }

    if (data.job_post && !(await JobPost.findOne({ where: { id: data.job_post } })))
        return {
            success: false,
            message: 'Job Post with provided ID not found.'
        }
        
    if (data.schedule && !(await Schedule.findOne({ where: { id: data.schedule } })))
        return {
            success: false,
            message: 'Schedule with provided ID not found.'
        }

    const shift = Shift.create({
        id: await randomId(Shift),
        user: data.user,
        start_time: data.start_time,
        end_time: data.end_time,
        job_post: data.job_post || null,
        schedule: data.schedule || null
    });

    return {
        success: true,
        message: 'Shift created succesffully.',
        id: shift.id
    };
}

/**
 * Updates an existing Shift.
 * @param {number} id - Shift ID
 * @param {Object} data - Shift data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateShift(id, data) {
    if (!id)
        return {
            success: false, 
            message: 'Shift ID not provided.'
        };
    
    const shift = await Shift.findOne({ where: { id } });

    if (!shift)
        return {
            success: false, 
            message: 'Shift not found.'
        };

    await shift.update(data);

    if (data.user && !(await User.findOne({ where: { id: data.user } })))
        return {
            success: false,
            message: 'Provided User not found.'
        }

    if (data.start_time)
        data.start_time = new Date(data.start_time);
    else
        data.start_time = new Date(shift.start_time);


    if (!(data.start_time instanceof Date && isNaN(data.start_time)))
        return {
            success: false,
            message: 'Invalid start time of the shift provided.'
        }
        
    if (data.end_time)
        data.end_time = new Date(data.end_time);
    else
        data.end_time = new Date(shift.end_time);


    if (!(data.end_time instanceof Date && isNaN(data.end_time)))
        return {
            success: false,
            message: 'Invalid end time of the shift provided.'
        }

    if (data.start_time > data.end_time)
        return {
            success: false,
            message: 'Start time cannot be greater than an end time.'
        }

    if (data.job_post && !(await JobPost.findOne({ where: { id: data.job_post } })))
        return {
            success: false,
            message: 'Provided Job Post not found.'
        }

    if (data.schedule && !(await Schedule.findOne({ where: { id: data.schedule } })))
        return {
            success: false,
            message: 'Provided Schedule not found.'
        }

    return {
        success: true,
        message: 'Shift updated succesffully.'
    }
}

/**
 * Deletes one or multiple Shifts.
 * @param {number|number[]} id - Single Shift ID or array of Shift IDs
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteShift({id} = {}) {
    if (!isNumberOrNumberArray(id))
        return { 
            success: false, 
            message: `Invalid Shift ID${Array.isArray(id) ? 's' : ''} provided.` 
        };
    
    const deletedShifts = await Shift.destroy({ where: { id } });

    if (!deletedShifts)
        return { 
            success: false, 
            message: `No Shifts found to delete for provided ID${Array.isArray(id) && id.length > 1 ? 's' : ''}:
                ${Array.isArray(id) ? id.join(', ') : id}` 
        };

    return { 
        success: true, 
        message: `${deletedShifts} Shift${deletedShifts > 1 ? 's' : ''} deleted successfully.`,
        deletedCount: deletedShifts 
    };
}

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

// Leave Pools
export async function getLeavePool({id} = {}) {
    if (!id || isNaN(id)) {
        const pools = await LeavePool.findAll({ raw: true });

        if (!pools || pools.length === 0)
            return [];

        return pools;
    }

    return await LeavePool.findByPk(id) || null;
}

export async function createLeavePool(data) {
    if (!data.name || !data.amount || !data.start_date || !data.end_date) 
        return { success: false, message: 'Mandatory data not provided.' };

    if (data.parent_pool && !(await LeavePool.findByPk(data.parent_pool)))
        return { success: false, message: 'Parent pool not found.' };

    const pool = await LeavePool.create({
        id: await randomId(LeavePool),
        name: data.name,
        amount: data.amount,
        parent_pool: data.parent_pool || null,
        start_date: data.start_date,
        end_date: data.end_date,
        comp_holiday: data.comp_holiday || false,
        comp_weekend: data.comp_weekend || false
    });

    return { success: true, message: 'LeavePool created successfully.', id: pool.id };
}

export async function updateLeavePool(id, data) {
    if (!id) 
        return { success: false, message: 'Leave Pool ID not provided.' };

    if (data.parent_pool && !(await LeavePool.findByPk(data.parent_pool)))
        return { success: false, message: 'Parent Pool not found.' };

    const pool = await LeavePool.findOne({ where: { id } });

    if (!pool) 
        return { success: false, message: 'LeavePool not found.' };

    await pool.update(data);

    return { success: true, message: 'LeavePool updated successfully.' };
}

export async function deleteLeavePool(id) {
    if (!isNumberOrNumberArray(id)) 
        return { success: false, message: 'Invalid LeavePool ID(s) provided.' };
    
    const deleted = await LeavePool.destroy({ where: { id } });
    
    if (!deleted)
        return { success: false, message: 'No LeavePools found to delete.' };
    
    return { 
        success: true,
        message: `${deleted} LeavePool${deleted > 1 ? 's' : ''} deleted successfully.`,
        deletedCount: deleted 
    };
}

// Leave Types
export async function getLeaveType({id} = {}) {
    if (!id || isNaN(id)) {
        const types = await LeaveType.findAll({ raw: true });
        
        if (!types || types.length === 0) 
            return [];
        
        return types;
    }

    return await LeaveType.findByPk(id) || null;
}

export async function createLeaveType(data) {
    if (!data.name || !data.leave_pool)
        return { success: false, message: 'Mandatory data not provided.' };
    
    if (!(await LeavePool.findOne({ where: { id: data.leave_pool } }))) 
        return { success: false, message: 'LeavePool not found.' };
    
    const type = await LeaveType.create({
        id: await randomId(LeaveType),
        name: data.name,
        leave_pool: data.leave_pool,
        color: data.color || null
    });

    return { success: true, message: 'LeaveType created successfully.', id: type.id };
}

export async function updateLeaveType(id, data) {
    if (!id) 
        return { success: false, message: 'LeaveType ID not provided.' };
    
    const type = await LeaveType.findOne({ where: { id } });
    
    if (!type)
        return { success: false, message: 'LeaveType not found.' };
    
    if (data.leave_pool && !(await LeavePool.findOne({ where: { id: data.leave_pool } })))
        return { success: false, message: 'LeavePool not found.' };
    
    await type.update(data);

    return { success: true, message: 'LeaveType updated successfully.' };
}

export async function deleteLeaveType(id) {
    if (!isNumberOrNumberArray(id)) 
        return { success: false, message: 'Invalid LeaveType ID(s) provided.' };
    
    const deleted = await LeaveType.destroy({ where: { id } });
    
    if (!deleted) 
        return { success: false, message: 'No LeaveTypes found to delete.' };
    
    return { 
        success: true, 
        message: `${deleted} LeaveType${deleted > 1 ? 's' : ''} deleted successfully.`, 
        deletedCount: deleted 
    };
}

// Leaves
export async function getLeave({id} = {}) {
    if (!id || isNaN(id)) {
        const leaves = await Leave.findAll({ raw: true });
        if (!leaves || leaves.length === 0) return [];
        return leaves;
    }
    return await Leave.findByPk(id) || null;
}

export async function createLeave(data) {
    if (!data.type || !data.start_date || !data.end_date || !data.days || !data.status || !data.user) {
        return { success: false, message: 'Mandatory data not provided.' };
    }
    if (!(await LeaveType.findOne({ where: { id: data.type } }))) {
        return { success: false, message: 'LeaveType not found.' };
    }
    if (!(await RequestStatus.findOne({ where: { id: data.status } }))) {
        return { success: false, message: 'RequestStatus not found.' };
    }
    if (!(await User.findOne({ where: { id: data.user } }))) {
        return { success: false, message: 'User not found.' };
    }
    if (data.approver && !(await User.findOne({ where: { id: data.approver } }))) {
        return { success: false, message: 'Approver not found.' };
    }
    const leave = await Leave.create({
        id: await randomId(Leave),
        type: data.type,
        start_date: data.start_date,
        end_date: data.end_date,
        days: data.days,
        status: data.status,
        user: data.user,
        approver: data.approver || null,
        user_note: data.user_note || null,
        approver_note: data.approver_note || null
    });
    return { success: true, message: 'Leave created successfully.', id: leave.id };
}

export async function updateLeave(id, data) {
    if (!id) return { success: false, message: 'Leave ID not provided.' };
    const leave = await Leave.findOne({ where: { id } });
    if (!leave) return { success: false, message: 'Leave not found.' };
    if (data.type && !(await LeaveType.findOne({ where: { id: data.type } }))) {
        return { success: false, message: 'LeaveType not found.' };
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
    await leave.update(data);
    return { success: true, message: 'Leave updated successfully.' };
}

export async function deleteLeave(id) {
    if (!isNumberOrNumberArray(id)) return { success: false, message: 'Invalid Leave ID(s) provided.' };
    const deleted = await Leave.destroy({ where: { id } });
    if (!deleted) return { success: false, message: 'No Leaves found to delete.' };
    return { success: true, message: `${deleted} Leave${deleted > 1 ? 's' : ''} deleted successfully.`, deletedCount: deleted };
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
    if (!data.holiday || !data.status || !data.user) {
        return { success: false, message: 'Mandatory data not provided.' };
    }
    if (!(await Holiday.findOne({ where: { id: data.holiday } }))) {
        return { success: false, message: 'Holiday not found.' };
    }
    if (!(await RequestStatus.findOne({ where: { id: data.status } }))) {
        return { success: false, message: 'RequestStatus not found.' };
    }
    if (!(await User.findOne({ where: { id: data.user } }))) {
        return { success: false, message: 'User not found.' };
    }
    if (data.approver && !(await User.findOne({ where: { id: data.approver } }))) {
        return { success: false, message: 'Approver not found.' };
    }
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
    if (!data.date || !data.status || !data.user) {
        return { success: false, message: 'Mandatory data not provided.' };
    }
    if (!(await RequestStatus.findOne({ where: { id: data.status } }))) {
        return { success: false, message: 'RequestStatus not found.' };
    }
    if (!(await User.findOne({ where: { id: data.user } }))) {
        return { success: false, message: 'User not found.' };
    }
    if (data.approver && !(await User.findOne({ where: { id: data.approver } }))) {
        return { success: false, message: 'Approver not found.' };
    }
    const working = await WeekendWorking.create({
        id: await randomId(WeekendWorking),
        date: data.date,
        status: data.status,
        user: data.user,
        approver: data.approver || null,
        user_note: data.user_note || null,
        approver_note: data.approver_note || null
    });
    return { success: true, message: 'WeekendWorking created successfully.', id: working.id };
}

export async function updateWeekendWorking(id, data) {
    if (!id) return { success: false, message: 'WeekendWorking ID not provided.' };
    const working = await WeekendWorking.findOne({ where: { id } });
    if (!working) return { success: false, message: 'WeekendWorking not found.' };
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
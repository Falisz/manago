// BACKEND/controller/workPlanner.js
import { Shift, JobPost, Schedule, Holiday } from '../models/workPlanner.js';
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

        const schedules = await Schedule.findAll({
            where,
            raw: true    
        });

        if (!schedules || schedules.length === 0)
            return [];

        return await Promise.all(schedules.map(async schedule => {
            if (include_shifts)
                schedule.shifts = await getShift({schedule: schedule.id});

            return schedule;
        }))

    }

    // Logic if the ID is provided - fetch a specific Schedule
    const schedule = await Schedule.findOne({where: { id }, raw: true});

    if (!schedule)
        return null;

    if (include_shifts)
        schedule.shifts = await getShift({schedule: schedule.id});
        
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
        return {
            success: false,
            message: 'Schedule Author not provided.'
        }

    if (!(await getUser(data.author)))
        return {
            success: false,
            message: 'Specified Author User not found.'
        }

    const schedule = Schedule.create({
        id: await randomId(Schedule),
        name: data.name || null,
        description: data.description || null,
        author: data.author
    });

    return {
        success: true,
        message: 'Schedule created succesffully.',
        id: schedule.id
    };
}

/**
 * Updates an existing Schedule.
 * @param {number} id - Schedule ID
 * @param {Object} data - Schedule data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateSchedule(id, data) {
    if (!id)
        return {
            success: false, 
            message: 'Schedule ID not provided.'
        };
    
    const schedule = await Schedule.findOne({ where: { id } });

    if (!schedule)
        return {
            success: false, 
            message: 'Schedule not found.'
        };

    if (data.author && !(await getUser(data.author)))
        return {
            success: false,
            message: 'Specified Author User not found.'
        }

    await schedule.update(data);
    
    return {
        success: true,
        message: 'Schedule updated succesffully.'
    }
}

/**
 * Deletes one or multiple Schedules and shifts included - if specified likewise.
 * @param {number|number[]} id - Single Schedule ID or array of Schedule IDs
 * @param {boolean} delete_shifts - optional - Should shifts within this Schedule be deleted. True by default.
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteSchedule({id, delete_shifts=true}) {
    if (!isNumberOrNumberArray(id))
        return { 
            success: false, 
            message: `Invalid Schedule ID${Array.isArray(id) ? 's' : ''} provided.` 
        };

    const transaction = await sequelize.transaction();
    
    try {
        const deletedSchedules = await Schedule.destroy({ where: { id }, transaction });

        if (!deletedSchedules) {
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
            message: `${deletedSchedules} Schedule${deletedSchedules > 1 ? 's' : ''} deleted successfully.`,
            deletedCount: deletedSchedules 
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
export async function deleteJobPost({id, delete_shifts=false}) {
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
            message: 'Start time is required to create a new shift.'
        }
        
    if (!data.end_time)
        return {
            success: false,
            message: 'Start time is required to create a new shift.'
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

export async function updateShift(id, data) {
    return await Shift.update(data, { where: { id } });
}

export async function deleteShifts(id) {
    return await Shift.destroy({ where: { id } });
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

// BACKEND/controller/workPlanner.js
import { Shift, JobPost, Schedule, Holiday } from '../models/workPlanner.js';
import { User } from '../models/users.js';
import { getUser } from './users.js';
import { Op } from 'sequelize';

// Holidays
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

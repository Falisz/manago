// BACKEND/controller/workPlanner/WeekendWorking.js
import {RequestStatus, User, WeekendWorking} from '#models';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';
import randomId from '#utils/randomId.js';

export async function getWeekendWorking({id, user, date} = {}) {
    if (id && !isNaN(id))
        return await WeekendWorking.findByPk(id, { raw: true});

    const where = {};

    if (user)
        where.user = user;

    if (date)
        where.date = date;

    const workings = await WeekendWorking.findAll({ where, raw: true });

    if (!workings?.length)
        return [];

    return workings;
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

    return {
        success: true,
        message: 'WeekendWorking updated successfully.'
    };
}

export async function deleteWeekendWorking(id) {
    if (!isNumberOrNumberArray(id)) return { success: false, message: 'Invalid WeekendWorking ID(s) provided.' };
    const deleted = await WeekendWorking.destroy({ where: { id } });
    if (!deleted) return { success: false, message: 'No WeekendWorkings found to delete.' };
    return {
        success: true,
        message: `${deleted} WeekendWorking${deleted > 1 ? 's' : ''} deleted successfully.`,
        deletedCount: deleted
    };
}
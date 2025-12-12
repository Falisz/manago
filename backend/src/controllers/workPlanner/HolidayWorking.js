// BACKEND/controller/workPlanner/HolidayWorking.js
import {Holiday, HolidayWorking, RequestStatus, User} from '#models';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';
import randomId from '#utils/randomId.js';

export async function getHolidayWorking({id, user, holiday} = {}) {
    if (id && !isNaN(id))
        return await HolidayWorking.findByPk(id, {raw: true});

    const where = {};

    if (user)
        where.user = user;

    if (holiday)
        where.holiday = holiday;

    const workings = await HolidayWorking.findAll({ where, raw: true });

    if (!workings?.length)
        return [];

    return workings;
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
    if (!id) return { success: false, message: 'Holiday Working Agreement ID not provided.' };
    const working = await HolidayWorking.findOne({ where: { id } });
    if (!working) return { success: false, message: 'Holiday Working Agreement not found.' };
    if (data.holiday && !(await Holiday.findOne({ where: { id: data.holiday } }))) {
        return { success: false, message: 'Holiday not found.' };
    }
    if (data.status && !(await RequestStatus.findByPk(data.status))) {
        return { success: false, message: 'Request Status not found.' };
    }
    if (data.user && !(await User.findOne({ where: { id: data.user } }))) {
        return { success: false, message: 'User not found.' };
    }
    if (data.approver && !(await User.findOne({ where: { id: data.approver } }))) {
        return { success: false, message: 'Approver not found.' };
    }
    await working.update(data);
    return { success: true, message: 'Holiday Working Agreement updated successfully.' };
}

export async function deleteHolidayWorking(id) {
    if (!isNumberOrNumberArray(id)) return { success: false, message: 'Invalid HolidayWorking ID(s) provided.' };
    const deleted = await HolidayWorking.destroy({ where: { id } });
    if (!deleted) return { success: false, message: 'No HolidayWorkings found to delete.' };
    return { success: true, message: `${deleted} HolidayWorking${deleted > 1 ? 's' : ''} deleted successfully.`, deletedCount: deleted };
}
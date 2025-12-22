// BACKEND/controller/workPlanner/WeekendWorking.js
import {RequestStatus, User, WeekendWorking} from '#models';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';
import randomId from '#utils/randomId.js';

export async function getWeekendWorking({id, user, date} = {}) {
    const include = [
        { model: User, as: 'WeekendWorkingUser', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'WeekendWorkingApprover', attributes: ['id', 'first_name', 'last_name']},
        { model: RequestStatus, attributes: ['id', 'name']}
    ];

    const flatten = (record) => {
        if (!record)
            return null;
        const result = record.toJSON();
        result.user = record['WeekendWorkingUser']?.toJSON();
        result.approver = record['WeekendWorkingApprover']?.toJSON();
        result.status = record['RequestStatus']?.toJSON();
        delete result['WeekendWorkingUser'];
        delete result['WeekendWorkingApprover'];
        delete result['RequestStatus'];
        return result;
    };

    if (id && !isNaN(id)) {
        const record = await WeekendWorking.findByPk(id, {include});
        return flatten(record);
    }

    const where = {};

    if (user)
        where.user = user;

    if (date)
        where.date = date;

    const result = await WeekendWorking.findAll({ where, include });
    return result.map(record => flatten(record));

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
        date_created: new Date(),
        date_requested: data.status === 1 ? new Date() : null,
        date_approved: data.status === 2 ? new Date() : null,
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

    const { status } = data;
    if (status === 1)
        data.date_requested = new Date();
    if (status === 2)
        data.date_approved = new Date();
    if (status === 3)
        data.date_rejected = new Date();
    if (status === 4)
        data.date_to_be_cancelled = new Date();
    if (status === 5)
        data.date_cancelled = new Date();

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
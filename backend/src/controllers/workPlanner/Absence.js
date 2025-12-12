// BACKEND/controller/workPlanner/Absence.js
import {Op} from 'sequelize';
import {updateAbsenceBalance} from '#controllers';
import {Absence, AbsenceType, RequestStatus, User} from '#models';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';
import randomId from '#utils/randomId.js';

/**
 * Retrieves multiple Absences or a one by its ID.
 * @param {number|null} id - optional - Absence ID to fetch a specific Absence
 * @param {number|number[]|null} user - optional - User ID or array of User IDs for which Leaves should be fetched
 * @param {number|number[]|null} approver - optional - Approver User ID or array of Approver User IDs for which Leaves should be fetched
 * @param date
 * @param start_date
 * @param end_date
 * @returns {Promise<Object|Object[]|null>} Single Absence, array of Leaves, or null
 */
export async function getAbsence({id, user, approver, date, start_date, end_date} = {}) {

    const include = [
        { model: User, attributes: ['id', 'first_name', 'last_name'] },
        { model: User, attributes: ['id', 'first_name', 'last_name'], as: 'Approver' },
        { model: RequestStatus, attributes: ['id', 'name']},
        { model: AbsenceType, attributes: ['name', 'color'] }
    ];

    const flattenAbsence = (leave) => {
        if (!leave)
            return null;

        const data = leave.toJSON();
        data.user = leave['User'].toJSON();
        data.approver = leave['Approver']?.toJSON();
        data.type = leave['AbsenceType']?.toJSON();
        data.status = leave['RequestStatus']?.toJSON();
        delete data['User'];
        delete data['Approver'];
        delete data['AbsenceType'];
        delete data['RequestStatus'];
        return data;
    };

    if (isNumberOrNumberArray(id)) {
        const leave = await Absence.findOne({where: {id}, include});
        return flattenAbsence(leave);
    }

    const where = {};

    if (isNumberOrNumberArray(user))
        where.user = user;

    if (isNumberOrNumberArray(approver))
        where.approver = approver;

    if (date) {
        where.start_date = { [Op.gte]: date };
        where.end_date = { [Op.or]: [{[Op.lte]: date }, {[Op.is]: null}]};

    } else {
        if (start_date)
            where.start_date = {[Op.gte]: start_date};

        if (end_date)
            where.end_date = {[Op.lte]: end_date};
    }

    const leaves = await Absence.findAll({ where, include });

    if (!leaves || !leaves.length)
        return null;

    return leaves.map(leave => flattenAbsence(leave));
}

/**
 * Creates a new Absence.
 * @param {Object} data - Absence data
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createAbsence(data) {
    if (data.type == null)
        return { success: false, message: 'Absence Type not provided.'};

    if (!data.user)
        return { success: false, message: 'User requesting a Absence not provided.'};

    if (!data.start_date)
        return { success: false, message: 'Leaves Date needed!'};

    if (!data.end_date)
        data.days = 1;

    if (!(await AbsenceType.findOne({ where: { id: data.type } })))
        return { success: false, message: 'Absence Type not found.' };

    data.status = Number(data.status);

    if (!(await RequestStatus.findOne({ where: { id: data.status } })))
        return { success: false, message: 'Request Status not found.' };

    if (!(await User.findOne({ where: { id: data.user } })))
        return { success: false, message: 'User not found.' };

    if (data.approver && !(await User.findOne({ where: { id: data.approver } })))
        return { success: false, message: 'Approver not found.' };

    const leave = await Absence.create({
        id: await randomId(Absence),
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

    const year = new Date(data.start_date).getFullYear();
    await updateAbsenceBalance({userId: data.user, typeId: data.type, year});

    return { success: true, message: 'Absence created successfully.', id: leave.id };
}

/**
 * Updates an existing Absence.
 * @param id
 * @param {Object} data - Absence data
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function updateAbsence(id, data) {
    if (!id)
        return { success: false, message: 'Absence ID not provided.' };

    const leave = await Absence.findOne({ where: { id } });

    if (!leave)
        return { success: false, message: 'Absence not found.' };

    if (data.type && !(await AbsenceType.findOne({ where: { id: data.type } })))
        return { success: false, message: 'Absence Type not found.' };

    if (data.status && !(await RequestStatus.findOne({ where: { id: data.status } })))
        return { success: false, message: 'Request Status not found.' };

    if (data.user && !(await User.findOne({ where: { id: data.user } })))
        return { success: false, message: 'User not found.' };

    if (data.approver && !(await User.findOne({ where: { id: data.approver } })))
        return { success: false, message: 'Approver not found.' };

    await leave.update(data);

    const year = new Date(data.start_date).getFullYear();
    await updateAbsenceBalance({userId: data.user, typeId: data.type, year});

    return { success: true, message: 'Absence updated successfully.' };
}

/**
 * Deletes an Absence.
 * @param {number|number[]} id - Single Shift ID or array of Shift IDs
 * @returns {Promise<{success: boolean, message: string, deletedCount: number}>}
 */
export async function deleteAbsence(id) {
    if (!isNumberOrNumberArray(id))
        return { success: false, message: 'Invalid Absence ID(s) provided.' };

    const leaves = await Absence.findAll({ where: { id }, raw: true });

    const deleted = await Absence.destroy({ where: { id } });

    if (!deleted)
        return { success: false, message: 'No Leaves found to delete.' };

    if (!leaves?.length) {
        const updated = new Set();
        for (const leave of leaves) {
            const { user: userId, type: typeId } = leave;
            const year = new Date(leave.start_date).getFullYear();
            const key = `${userId}-${typeId}-${year}`;
            if (!updated.has(key)) {
                await updateAbsenceBalance({userId, typeId, year});
                updated.add(key);
            }
        }
    }

    return {
        success: true,
        message: `${deleted} Leave${deleted > 1 ? 's' : ''} deleted successfully.`,
        deletedCount: deleted
    };
}
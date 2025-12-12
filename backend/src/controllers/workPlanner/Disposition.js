// BACKEND/controller/workPlanner/Disposition.js
import {Op} from 'sequelize';
import {Disposition, DispositionPreset, User} from '#models';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';
import randomId from '#utils/randomId.js';

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
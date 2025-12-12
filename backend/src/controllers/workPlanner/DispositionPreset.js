// BACKEND/controller/workPlanner/DispositionPreset.js
import {DispositionPreset} from '#models';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';
import randomId from '#utils/randomId.js';

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
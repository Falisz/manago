// BACKEND/controller/timesheets/LaborStatus.js
import {LaborStatus} from '#models';

export async function getLaborStatus({id} = {}) {
    if (!id || isNaN(id)) {
        const statuses = await LaborStatus.findAll({ raw: true });
        if (!statuses || statuses.length === 0) return [];
        return statuses;
    }
    return await LaborStatus.findByPk(id) || null;
}
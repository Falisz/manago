// BACKEND/controller/workPlanner/RequestStatus.js
import {RequestStatus} from '#models';

export async function getRequestStatus({id} = {}) {
    if (!id || isNaN(id)) {
        const statuses = await RequestStatus.findAll({ raw: true });
        if (!statuses || statuses.length === 0) return [];
        return statuses;
    }
    return await RequestStatus.findByPk(id) || null;
}
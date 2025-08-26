//BACKEND/utils/manager-view.js
import {UserConfigs} from "../models/user.js";

export async function hasManagerAccess(userId) {
    const userConfig = await UserConfigs.findOne({ where: { user: userId } });

    return userConfig && userConfig.manager_view_access;
}

export async function hasManagerView(userId) {
    const userConfig = await UserConfigs.findOne({ where: { user: userId } });

    return userConfig && userConfig.manager_view_enabled;
}

export async function setManagerView(userId, value) {
    const [updated] = await UserConfigs.update(
        { manager_view_enabled: value },
        { where: { user: userId } }
    );

    return updated === 1;
}

export async function toggleManagerNav(userId, value) {
    const [updated] = await UserConfigs.update(
        { manager_nav_collapsed: value },
        { where: { user: userId } }
    );

    return updated === 1;
}
// BACKEND/utils/securityLogs.js
import {AppSecurityLog} from "../models/appResources.js";
import {now} from "sequelize/lib/utils";

export async function securityLog(user, org, action, message) {
    await AppSecurityLog.create({
        timestamp: now(),
        user: user,
        org: org,
        action: action,
        message: message
    });
}
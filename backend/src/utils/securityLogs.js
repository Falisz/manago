import {AppSecurityLogs} from "../models/appAuditLogs.js";
import {now} from "sequelize/lib/utils";

export async function securityLog(user, org, action, message) {
    await AppSecurityLogs.create({
        timestamp: now(),
        user: user,
        org: org,
        action: action,
        message: message
    });
}
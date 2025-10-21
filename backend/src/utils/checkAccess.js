// BACKEND/utils/checkAccess.js
import {
    getUserPermissions,
    getRolePermissions,
    getUserRoles,
    getUserManagers
} from '../controllers/users.js';
import { getTeamUsers } from '../controllers/teams.js';
import { getProject } from '../controllers/projects.js';
import { getBranch } from '../controllers/branches.js';
import { getSchedule } from '../controllers/workPlanner.js';

async function checkAccess(user, action, resource, id, resource2, id2) {
    if (!user || !action || !resource) 
        return false;

    resource = resource.toString().toLowerCase();
    action = action.toString().toLowerCase();
    
    const userPermissions = (await getUserPermissions({ user })).map(p => p.name);
    const userRoles = (await getUserRoles({ userId: user })).map(r => r.id);
    const rolePermissions = (await getRolePermissions({ role: userRoles })).map(p => p.name);
    const permissions = new Set([...userPermissions, ...rolePermissions]);

    // Wild-card permission
    if (permissions.has('*'))
        return { hasAccess: true };

    const hasPermission = (resource = resource, resource2 = resource2) =>
        permissions.has(
            action.toLowerCase() +
            '-' + resource.toLowerCase() +
            (action === 'assign' && resource2 ? '-' + resource2.toLowerCase() : '')
        );

    const resourceAccess = async (resource, ids) => {
        if (!resource)
            return false;

        if (!ids instanceof Set)
            ids = new Set(ids);

        let allowedIds;

        if (resource === 'user' || resource === 'manager') {
            const directReportees = (await getUserManagers({manager: user, include_all_users: true})).map(u => u.id);
            const managedTeams = (await getTeamUsers({user, role: 3, include_subteams: true})).map(t => t.id);
            const teamReportees = (await getTeamUsers({team: managedTeams, role: [1, 2], include_subteams: true})).map(u => u.id);
            
            allowedIds = new Set([...directReportees, ...teamReportees]);
        }

        else if (resource === 'role') {
            allowedIds = new Set((await getUserRoles({user})).map(r => r.id));

            if (allowedIds.has(11))
                [1, 2, 3].forEach(r => allowedIds.add(r));

            if (allowedIds.has(12) || allowedIds.has(13))
                [1, 2, 3, 11].forEach(r => allowedIds.add(r));
        }

        else if (resource === 'team')
            allowedIds = new Set((await getTeamUsers({user, role: 3, include_subteams: true})).map(t => t.id));

        else if (resource === 'project')
            allowedIds = new Set((await getProject({manager: user})).map(p => p.id));

        else if (resource === 'branch')
            allowedIds = new Set((await getBranch({manager: user})).map(p => p.id));

        else if (resource === 'schedule')
            allowedIds = new Set((await getSchedule({author: user})).map(s => s.id));

        const hasAccess = ids.isSubsetOf(allowedIds);
        let forbiddenIds;
        
        if (!hasAccess) 
            forbiddenIds = ids.difference(allowedIds);

        return { hasAccess, forbiddenIds };
    }
    
    // Self permission
    if (action !== 'assign' && resource === 'user' && id === user && hasPermission('self')) 
        return { hasAccess: true };

    // Any-resource permission
    if (hasPermission(resource, action === 'assign' ?? resource2))
        return { hasAccess: true };

    // Managed-resource permissions 
    // permission name format: <action>-managed-<resource> (e.g. read-managed-user)
    if (action !== 'assign')
        if (hasPermission(`managed-${resource}`))
            return await resourceAccess(resource, Array.from(id));
    
    else
        if (hasPermission('assign', resource, resource2))
            return { hasAccess: true };
        
        else if (hasPermission(`managed-${resource}`, resource2))
            return await resourceAccess(resource, Array.from(id));
        
        else if (hasPermission(resource, `managed-${resource2}`))
            return await resourceAccess(resource2, Array.from(id2));
        
        else if (hasPermission(`managed-${resource}`, `managed-${resource2}`)) {
            const { hasAccess, forbiddenIds } = await resourceAccess(resource, Array.from(id));
            const { hasAccess2, forbiddenIds2 } = await resourceAccess(resource2, Array.from(id2));
            
            return { hasAccess: hasAccess && hasAccess2, forbiddenIds, forbiddenIds2 }
        }

    return { hasAccess: false };
    
}

export default checkAccess;
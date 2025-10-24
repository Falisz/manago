// BACKEND/utils/checkAccess.js
import {
    getUserPermissions,
    getRolePermissions,
    getUserRoles,
    getUserManagers
} from '../controllers/users.js';
import { getTeamUsers } from '../controllers/teams.js';
import { getProject, getProjectUsers } from '../controllers/projects.js';
import { getBranch, getBranchUsers } from '../controllers/branches.js';
import { getSchedule, getShift } from '../controllers/workPlanner.js';

async function getManagedUsers(manager) {
    const reportees = (await getUserManagers({manager, include_all_users: true})).map(u => u.id);
    
    const managedTeams = (await getTeamUsers({user: manager, role: 3, include_subteams: true})).map(t => t.id);
    const teamReportees = (await getTeamUsers({team: managedTeams, role: [1, 2], include_subteams: true})).map(u => u.id);
    
    const managedProjects = (await getProject({manager})).map(p => p.id);
    const projectReportees = (await getProjectUsers({project: managedProjects})).map(u => u.id);

    const managedBranches = (await getBranch({manager})).map(b => b.id);
    const branchReportees = (await getBranchUsers({branch: managedBranches})).map(u => u.id);

    return Array.from(new Set([
        ...reportees,
        ...teamReportees,
        ...projectReportees,
        ...branchReportees
    ]));
}

async function checkAccess(user, action, resource, id, resource2, id2) {
    if (!user || !action || !resource) 
        return false;

    resource = resource.toString().toLowerCase();
    action = action.toString().toLowerCase();
    
    const userPermissions = (await getUserPermissions({ user })).map(p => p.name);
    const userRoles = (await getUserRoles({ user })).map(r => r.id);
    const rolePermissions = (await getRolePermissions({ role: userRoles })).map(p => p.name);
    const permissions = new Set([...userPermissions, ...rolePermissions]);
    
    // Wild-card permission
    if (permissions.has('*'))
        return { hasFullAccess: true, hasAccess: true };

    const hasPermission = (resource = resource, resource2 = resource2) =>
        permissions.has(
            action.toLowerCase() +
            '-' + resource.toLowerCase() +
            (action === 'assign' && resource2 ? '-' + resource2.toLowerCase() : '')
        );

    /** 
     * Resource Access.
     * @param {string} resource - resource kind
     * @param {number|number[]} ids - Resources IDs (optional)
     * @param {string} type - optional - default: managed - resource type, being: managed, own
    **/
    const resourceAccess = async (resource, ids, type='managed') => {
        if (!resource || !ids)
            return { hasFullAccess: false, hasAccess: false };

        if (!Array.isArray(ids))
            ids = [ids];

        let permittedIds;
        
        if (type === 'managed')
            if (resource === 'user' || resource === 'manager')
                permittedIds = new Set(await getManagedUsers(user));
            
            else if (resource === 'role') {
                permittedIds = new Set((await getUserRoles({user})).map(r => r.id));

                if (permittedIds.has(11))
                    [1, 2, 3].forEach(r => permittedIds.add(r));

                if (permittedIds.has(12) || permittedIds.has(13))
                    [1, 2, 3, 11].forEach(r => permittedIds.add(r));
            }

            else if (resource === 'team')
                permittedIds = new Set((await getTeamUsers({user, role: 3, include_subteams: true})).map(t => t.id));

            else if (resource === 'project')
                permittedIds = new Set((await getProject({manager: user})).map(p => p.id));

            else if (resource === 'branch')
                permittedIds = new Set((await getBranch({manager: user})).map(p => p.id));

            else if (resource === 'schedule')
                permittedIds = new Set((await getSchedule({author: user})).map(s => s.id));

            else if (resource === 'shift')
                permittedIds = new Set((await getShift({user: await getManagedUsers(user)})).map(s => s.id));

        else if (type === 'own')
            if (resource === 'user')
                permittedIds = new Set([user]);

            else if (resource === 'role')
                permittedIds = new Set((await getUserRoles({user})).map(r => r.id));
            
        const hasFullAccess = [...ids].every(id => permittedIds.has(id));
        let hasAccess = false;
        let allowedIds = [];
        let forbiddenIds = [];

        if (!hasFullAccess) {
            allowedIds = [...ids].filter(id => permittedIds.has(id));
            forbiddenIds = [...ids].filter(id => !permittedIds.has(id));
        }

        if (allowedIds.length > 0)
            hasAccess = true;

        return { hasFullAccess, hasAccess, allowedIds, forbiddenIds };
    }
    
    // Self permission
    if (action !== 'assign' && resource === 'user' && id === user && hasPermission('self')) 
        return { hasFullAccess: true, hasAccess: true };

    // Any-resource permission
    if (hasPermission(resource, action === 'assign' ?? resource2))
        return { hasFullAccess: true, hasAccess: true };

    if (action === 'create')
        return { hasFullAccess: true, hasAccess: false };

    // Managed-resource permissions 
    // permission name format: <action>-managed-<resource> (e.g. read-managed-user)
    for (const type of ['managed', 'own'])
        if (action !== 'assign')
            if (hasPermission(`${type}-${resource}`))
                return await resourceAccess(resource, Array.from(id));
        
        else
            if (hasPermission('assign', resource, resource2))
                return { hasFullAccess: true, hasAccess: true };
            
            else if (hasPermission(`${type}-${resource}`, resource2))
                return await resourceAccess(resource, Array.from(id));
            
            else if (hasPermission(resource, `${type}-${resource2}`))
                return await resourceAccess(resource2, Array.from(id2));
            
            else if (hasPermission(`${type}-${resource}`, `${type}-${resource2}`)) {
                const { 
                    hasFullAccess, 
                    hasAccess, 
                    allowedIds,
                    forbiddenIds 
                } = await resourceAccess(resource, Array.from(id));
                const { 
                    hasFullAccess: hasFullAccess2, 
                    hasAccess: hasAccess2, 
                    allowedIds: allowedIds2,
                    forbiddenIds: forbiddenIds2
                } = await resourceAccess(resource2, Array.from(id2));
                
                return { 
                    hasFullAccess: hasFullAccess && hasFullAccess2, 
                    hasAccess: hasAccess && hasAccess2, 
                    allowedIds,
                    forbiddenIds,
                    allowedIds2, 
                    forbiddenIds2
                };
            }

    return { hasFullAccess: false, hasAccess: false };
    
}

export default checkAccess;
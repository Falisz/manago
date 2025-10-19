// BACKEND/utils/permissions.js
import {
    getUserPermissions,
    getRolePermissions,
    getUserRoles,
    getUserManagers
} from '../controllers/users.js';
import {getTeamUsers} from "../controllers/teams.js";

async function managedUsers(managers, visited = new Set()) {
     if (!managers || (Array.isArray(managers) && managers.length === 0))
        return new Set();

    const managerIds = Array.isArray(managers) ? managers.slice() : [managers];

    const toQuery = managerIds.filter(id => id != null && !visited.has(id));

    if (toQuery.length === 0) 
        return new Set();

    toQuery.forEach(id => visited.add(id));
    
    const direct = (await getUserManagers({ managerId: toQuery })).map(u => u.id).filter(id => id != null);

    const result = new Set(direct);
    
    direct.forEach(id => visited.add(id));
    
    if (direct.length > 0)
        (await managedUsers(direct, visited)).forEach(id => result.add(id));

    return result;
}

async function assignedRoles(user) {
    const roleIds = (await getUserRoles({userId: user})).map(r => r.id);
    return new Set(roleIds);
}

async function managedTeams(user) {
    const teamIds = (await getTeamUsers({user, role: 3, include_subteams: true})).map(t => t.teamId);
    return new Set(teamIds);
}

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
        return true;

    const hasPermission = (resource=resource, resource2=resource2) =>
        permissions.has(
            action.toLowerCase() +
            '-' + resource.toLowerCase() +
            (action === 'assign' && resource2 ? '-' + resource2.toLowerCase() : '')
        );

    async function resourceAccess(resource, ids) {
        if (!resource)
            return false;

        if (!ids instanceof Set)
            ids = new Set(ids);

        let allowedIds = new Set();

        if (resource === 'user' || resource === 'manager')
            allowedIds = await managedUsers(user);

        else if (resource === 'role')
            allowedIds = await assignedRoles(user);

        else if (resource === 'team')
            allowedIds = await managedTeams(user);
        
        if (!allowedIds instanceof Set)
            allowedIds = new Set(allowedIds);

        return ids.isSubsetOf(allowedIds);
    }
    
    // Self permission
    if (resource === 'user' && id === user && hasPermission('self')) 
        return true;


    // Any-resource permission
    if (hasPermission('any-' + resource, action === 'assign' ?? 'any-' + resource2))
        return true;

    // Managed-resource permissions 
    // permission name format: <action>-managed-<resource> (e.g. read-managed-user)
    if (action !== 'assign')
        if (hasPermission(`managed-${resource}`))
            return await resourceAccess(resource, Array.from(id));
    else
        if (hasPermission('assign', `any-${resource}`, `any-${resource2}`))
            return true;
        else if (hasPermission('assign', `managed-${resource}`, `any-${resource2}`))
            return await resourceAccess(resource, Array.from(id));
        else if (hasPermission('assign', `any-${resource}`, `managed-${resource2}`))
            return await resourceAccess(resource2, Array.from(id2));
        else if (hasPermission('assign', `managed-${resource}`, `managed-${resource2}`))
            return await resourceAccess(resource, Array.from(id)) && resourceAccess(resource2, Array.from(id2));

    return false;
    
}

export default checkAccess;
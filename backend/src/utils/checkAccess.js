// BACKEND/utils/checkAccess.js
import {
    getUserPermissions,
    getRolePermissions,
    getUserRoles,
    getUserManagers
} from '../controllers/users.js';
import {
    getTeamUsers
} from '../controllers/teams.js';

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

        let allowedIds = new Set();

        if (resource === 'user' || resource === 'manager')
            allowedIds = new Set((await getUserManagers({manager: user, include_all_users: true })).map(u => u.id));

        else if (resource === 'role') {
            allowedIds = new Set((await getUserRoles({user})).map(r => r.id));

            if (allowedIds.has(11))
                [1, 2, 3].forEach(r => allowedIds.add(r));

            if (allowedIds.has(12) || allowedIds.has(13))
                [1, 2, 3, 11].forEach(r => allowedIds.add(r));
        }

        else if (resource === 'team')
            allowedIds = new Set((await getTeamUsers({user, role: 3, include_subteams: true})).map(t => t.id));
        
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
        else if (hasPermission(`managed-${resource}`, `any-${resource2}`))
            return await resourceAccess(resource, Array.from(id));
        else if (hasPermission(`any-${resource}`, `managed-${resource2}`))
            return await resourceAccess(resource2, Array.from(id2));
        else if (hasPermission(`managed-${resource}`, `managed-${resource2}`))
            return await resourceAccess(resource, Array.from(id)) && resourceAccess(resource2, Array.from(id2));

    return false;
    
}

export default checkAccess;
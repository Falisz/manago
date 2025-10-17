// BACKEND/utils/permissions.js
import { getUserPermissions, getRolePermissions, getUserRoles, getUserManagers } from '../controllers/users.js';


resources = ['user', 'role', 'team', 'project', 'branch', 'schedule', 'shift', 'leave'];

// Permissions like the ones above will be assigned per user or per role.
permissions = [
    { name: '*', desc: ' '},
    // Resource: User
    { name: 'create-any-user', desc: '' }, 
    { name: 'read-any-user', desc: '' }, // All users
    { name: 'update-any-user', desc: '' },
    { name: 'delete-any-user', desc: '' },
    { name: 'read-managed-user', desc: '' }, // Only managed users
    { name: 'update-managed-user', desc: '' },
    { name: 'delete-managed-user', desc: '' },
    { name: 'read-self', desc: '' }, // Only yourself
    { name: 'update-self', desc: '' },
    { name: 'delete-self', desc: '' },
    // Resource: Role
    { name: 'create-any-role', desc: ''},
    { name: 'read-any-role', desc: ''}, // All roles
    { name: 'update-any-role', desc: ''},
    { name: 'delete-any-role', desc: ''},
    { name: 'read-lower-role', desc: ''}, // Lower roles
    { name: 'update-lower-role', desc: ''},
    { name: 'delete-lower-role', desc: ''},
    // Assignment: UserManager
    { name: 'assign-any-user-any-manager', desc: ''},
    { name: 'read-any-user-any-manager', desc: ''},
    { name: 'assign-managed-user-any-manager', desc: ''},
    { name: 'read-managed-user-any-manager', desc: ''},
    { name: 'assign-any-user-managed-manager', desc: ''},
    { name: 'read-any-user-managed-manager', desc: ''},
    { name: 'assign-managed-user-managed-manager', desc: ''},
    { name: 'read-managed-user-managed-manager', desc: ''},
    // Assignment: SelfManager
    { name: 'assign-self-manager', desc: ''},
    // Assignment: UserRole
    { name: 'assign-any-user-any-role', desc: ''},
    { name: 'read-any-user-any-role', desc: ''},
    { name: 'assign-managed-user-any-role', desc: ''},
    { name: 'read-managed-user-any-role', desc: ''},
    { name: 'assign-any-user-managed-role', desc: ''},
    { name: 'read-any-user-managed-role', desc: ''},
    { name: 'assign-managed-user-managed-role', desc: ''},
    { name: 'read-managed-user-managed-role', desc: ''},
    // Assignment: SelfRole
    { name: 'assign-self-role', desc: ''},
]

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

async function lowerRoles(user) {
    return new Set();
}

async function managedTeams(user) {
    return new Set();
}

async function checkAccess(user, action, resource, id, resource2, id2) {

    if (!user || !action || !resource) 
        return false;

    resource = resource.toString().toLowerCase();
    action = action.toString().toLowerCase();
    
    const userPermissions = (await getUserPermissions({ user })).map(p => p.name);
    const userRoles = (await getUserRoles({userId: user})).map(r => r.id);
    const rolePermissions = (await (getRolePermissions({role: userRoles}))).map(p => p.name);
    const permissions = new Set([...userPermissions, ...rolePermissions]);

    // Wild-card permission
    if (permissions.has('*'))
        return true;


    function hasPermission(resource=resource, resource2=resource2) {
        const permission = action.toLowerCase() + '-' + resource.toLowerCase() +
        (action === 'assign' && resource2 ? '-' + resource2.toLowerCase() : '');

        return permissions.has(permission);
    }

    async function resourceAccess(resource, ids) {
        if (!resource)
            return false;

        if (!ids instanceof Set)
            ids = new Set(ids);

        let allowedIds = new Set();

        if (resource === 'user' || resource === 'manager')
            allowedIds = await managedUsers(user);

        else if (resource === 'role')
            allowedIds = await lowerRoles(user);

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
            return resourceAccess(resource, Array.from(id));
    else
        if (hasPermission('assign', `any-${resource}`, `any-${resource2}`))
            return true;
        else if (hasPermission('assign', `managed-${resource}`, `any-${resource2}`))
            return resourceAccess(resource, Array.from(id));
        else if (hasPermission('assign', `any-${resource}`, `managed-${resource2}`))
            return resourceAccess(resource2, Array.from(id2));
        else if (hasPermission('assign', `managed-${resource}`, `managed-${resource2}`))
            return resourceAccess(resource, Array.from(id)) && resourceAccess(resource2, Array.from(id2));

    return false;
    
}

export default checkAccess;
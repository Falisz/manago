// BACKEND/utils/permissions.js
import { getUserPermissions, getRolePermissions, getUserRoles, getUserManagers } from '../controllers/users.js';

// Permissions like the ones above will be assigned per user or per role.
permissions = [
    { name: '*', desc: ' '},
    { name: 'read-self', desc: '' },
    { name: 'update-self', desc: '' },
    { name: 'delete-self', desc: '' },
    { name: 'assign-self-role', desc: ' '},
    { name: 'create-user', desc: '' },
    { name: 'read-user', desc: '' },
    { name: 'read-managed-user', desc: '' },
    { name: 'update-user', desc: '' },
    { name: 'update-managed-user', desc: '' },
    { name: 'delete-user', desc: '' },
    { name: 'delete-managed-user', desc: '' },
    { name: 'assign-user-role', desc: ' '},
    { name: 'assign-managed-user-role', desc: ' '},
    { name: 'read-user-role', desc: ' '},
]

async function hasPermission(user, action, resource, resource2) {
    const userPermissions = await getUserPermissions({ user });
    
    const userRoles = (await getUserRoles({userId: user})).map(r => r.id);

    const rolePermissions = getRolePermissions({role: userRoles});

    const permissions = new Set(userPermissions, rolePermissions);

    const permission = action.toLowerCase() + '-' + resource.toLowerCase() +
     (resource2 ? '-' + resource2.toLowerCase() : '');

    return permissions.has(permission);
}

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

function canDo(user, action, resource, id, resource2, id2) {
    let access = false;

    if (action === 'assign')
        access = hasPermission(user, action, resource, resource2);
    
    if (resource === 'User' && user === id)
        access = hasPermission(user, action, 'Self');

    if (access)
        return access;

    if (resource === 'User')
        access = hasPermission(user, action, resource);

    if (!access) {
        access = hasPermission(user, action, 'Managed'+resource);

        if (access) {
            const allowedIds = managedUsers([user]);
            const ids = new Set(id);
            access = ids.isSubsetOf(allowedIds);
        }

    }

    return access;
    
}

export default canDo;
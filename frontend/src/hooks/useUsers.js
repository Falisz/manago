// FRONTEND/hooks/useUser.js
import { useCallback, useRef, useState } from 'react';
import axios from 'axios';

const useUsers = () => {
    // States and Refs
    const [users, setUsers] = useState(null);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(null);
    const [warning, setWarning] = useState(null);
    const [error, setError] = useState(null);
    const userCacheRef = useRef({});

    // Callbacks
    const clearNotices = () => {
        setError(null);
        setWarning(null);
        setSuccess(null);
    };

    const fetchUsers = useCallback(async ({userId = null, userScope = 'all', scopeId = null, group = null,
                                              loading = true, reload = false, map = false} = {}) => {

        if (userId && userCacheRef.current[userId] && !reload) {
            clearNotices();
            setLoading(false);

            setUsers(userCacheRef.current[userId]);
            return userCacheRef.current[userId];
        }

        try {
            setLoading(loading);

            let url = '/users';

            if (userId) {
                url = `/users/${userId}`;
            } else if (userScope !== 'all') {
                if (userScope === 'manager')
                    url = `/users/${scopeId}/managed-users`;

                else if (userScope === 'team')
                    url = `/teams/${scopeId}/users?include_subteams=true`;

                else if (userScope === 'branch')
                    url = `/branches/${scopeId}/users`;

                else if (userScope === 'project')
                    url = `/projects/${scopeId}/users`;

            } else if (group === 'employees' || group === 'managers') {
                url = `/users?group=${group}`;
            }

            const res = await axios.get(url, { withCredentials: true });

            if (userId)
                userCacheRef.current[userId] = res.data;

            let users = res.data;

            if (map) {
                if (!Array.isArray(users))
                    users = [users];
                users = new Map(
                    users.map(user => [user.id, user])
                );
            }

            setUsers(users);

            return users;

        } catch (err) {
            console.error('Error fetching users:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUser = useCallback(async ({userId, reload}) => await fetchUsers({userId, reload}), [fetchUsers]);

    const saveUser = useCallback(async (formData, userId = null) => {
        const newUser = !userId;
        try {
            clearNotices();

            const userData = {
                login: formData.login,
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name,
                active: formData.active,
                manager_view_access: formData.manager_view_access
            }

            if (newUser) {
                const res = await axios.post('/users', userData, { withCredentials: true });
                userId = parseInt(res.data.user?.id);
            } else {
                await axios.put(`/users/${userId}`, userData, { withCredentials: true });
            }

            if (userId) {
                await axios.put(`/users/${userId}/roles`, { roleIds: formData.roles.filter(role => role !== null) }, { withCredentials: true });

                if (formData.managers && formData.managers.length > 0 ) {
                    await axios.put(`/users/${userId}/managers`, { managerIds: formData.managers.filter(role => role !== null) }, { withCredentials: true });
                }
            }

            setSuccess(`User ${newUser? 'created' : 'updated'} successfully.`);

            return fetchUser(userId, true);
        } catch(err) {
            console.error('Error saving new user data:', err);
            setWarning('Error occurred while saving new user data. ' + err.response?.data?.message);
            return null;
        }
    }, [fetchUser]);

    const deleteUsers = useCallback(async ({userId, userIds}) => {
        if (userId) try {
            setLoading(true);
            clearNotices();
            await axios.delete(`/users/${userId}`, { withCredentials: true });
            delete userCacheRef.current[userId];
            return true;

        } catch (err) {
            console.error('Error deleting user:', err);
            setError('Failed to delete user. Please try again.');
            return false;
        } finally {
            setLoading(false);
        } else try {
            await axios.delete(`/users`, {data: {userIds: Array.from(userIds)}}, { withCredentials: true });
            return true;
        } catch (err) {
            console.error('Error deleting Users:', err);
            return false;
        }
    }, []);

    const deleteUser = useCallback(async ({userId}) => await deleteUsers({userId}), [deleteUsers]);

    const saveUserAssignment = useCallback(async (resource, resourceIds, userIds, mode='set') => {
        try {
            clearNotices();
            return await axios.post('/users/assignments', {resource, resourceIds, userIds, mode}, { withCredentials: true });
        } catch (err) {
            console.error('Error saving new user assignments:', err);
            setWarning('Error occurred while saving new user assignments. ' + err.response?.data?.message);
            return null;
        }
    }, []);

    return {
        users,
        loading,
        success,
        warning,
        error,
        fetchUsers,
        fetchUser,
        saveUser,
        deleteUsers,
        deleteUser,
        setLoading,
        saveUserAssignment
    };
}
export default useUsers;
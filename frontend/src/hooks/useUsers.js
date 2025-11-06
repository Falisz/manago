// FRONTEND/hooks/useUser.js
import { useCallback, useState } from 'react';
import axios from 'axios';
import useAppState from '../contexts/AppStateContext';

const useUsers = () => {
    const [users, setUsers] = useState();
    const [loading, setLoading] = useState();
    const [status, setStatus] = useState([]);
    const { appCache } = useAppState();
    const userCache = appCache.current.users;

    const fetchUsers = useCallback(async ({userId = null, user_scope = 'all', user_scope_id = null, group = null,
                                              loading = true, reload = false, map = false} = {}) => {

        let users;
        setStatus([]);

        if (userId && !reload && userCache[userId])
            users = userCache[userId];

        else try {
            setLoading(loading);

            let url = '/users';

            if (userId) {
                url = `/users/${userId}`;
            } else if (user_scope !== 'all' && user_scope_id) {
                if (user_scope === 'manager')
                    url = `/users/${user_scope_id}/managed-users`;

                else if (user_scope === 'team')
                    url = `/teams/${user_scope_id}/users?include_subteams=true`;

                else if (user_scope === 'branch')
                    url = `/branches/${user_scope_id}/users`;

                else if (user_scope === 'project')
                    url = `/projects/${user_scope_id}/users`;

            } else if (group === 'employees' || group === 'managers') {
                url = `/users?group=${group}`;
            }

            const res = await axios.get(url, { withCredentials: true });

            if (userId)
                userCache[userId] = res.data;

            users = res.data;

        } catch (err) {
            console.error('fetchUsers error:', err);

            const message = 'Error occurred while fetching the User data.';
            setStatus(prev => [...prev, {status: 'error', message}]);
        }

        if (map) {
            if (users != null && !Array.isArray(users))
                users = [users];

            if (users != null && Array.isArray(users))
                users = new Map(
                    users.map(user => [user.id, user])
                );
        }

        setUsers(users);
        setLoading(false);
        return users;

    }, [userCache]);

    const fetchUser = useCallback(async ({userId, reload} = {}) =>
        await fetchUsers({userId, reload}), [fetchUsers]);

    const saveUser = useCallback(async ({userId = null, formData} = {}) => {
        if (!formData)
            return null;

        const newUser = !userId;

        try {
            setStatus([]);

            let res;

            if (newUser)
                res = await axios.post(
                    '/users',
                    formData,
                    { withCredentials: true }
                );

            else
                res = await axios.put(
                    `/users/${userId}`,
                    formData,
                    { withCredentials: true }
                );

            const { data } = res;

            if (data.message)
                setStatus(prev => [...prev, {status: 'success', message: data.message}]);

            return ( data && data.user ) || null;

        } catch(err) {

            console.error('saveUser error:', err);

            const { response } = err;
            let message = 'Error occurred while saving the user data.';
            if (response && response.data)
                message += ' ' + response.data.message;
            message += ' Please try again later.';
            setStatus(prev => [...prev, {status: 'error', message}]);

            return null;
        }
    }, []);

    // TODO: To refactor
    const saveUserAssignment = useCallback(async (resource, resourceIds, userIds, mode='set') => {
        try {
            setStatus([]);

            return await axios.post('/users/assignments', {resource, resourceIds, userIds, mode}, { withCredentials: true });

        } catch (err) {
            console.error('saveUserAssignment error:', err);

            const message = 'Error occurred while saving new User assignments. ' + err.response?.data?.message
            setStatus(prev => [...prev, {status: 'error', message}]);

            return null;
        }
    }, []);

    const deleteUsers = useCallback(async ({userId, userIds} = {}) => {

        const batchMode = Array.isArray(userIds) && userIds.length > 0;

        try {
            setLoading(true);
            setStatus([]);

            let res;

            if (batchMode)
                res = await axios.delete(
                    `/users/${userId}`,
                    { withCredentials: true }
                );
            else
                res = await axios.delete(
                    `/users`,
                    { data: {userIds: Array.from(userIds).filter(id => id != null)}},
                    { withCredentials: true }
                );

            const { data } = res;

            if (batchMode && data.ids)
                userIds = data.ids;

            if (data.warning)
                setStatus(prev => [...prev, {status: 'warning', message: data.warning}]);

            if (data.message)
                setStatus(prev => [...prev, {status: 'success', message: data.message}]);

            if (batchMode)
                userIds.forEach(userId => delete userCache[userId]);
            else
                delete userCache[userId];

            return true;
        } catch (err) {
            console.error('deleteTeams error:', err);

            const message = 'Failed to delete Team' + (batchMode ? 's' : '') + '. Please try again.';
            setStatus(prev => [...prev, {status: 'error', message}]);

            return null;
        } finally {
            setLoading(false);
        }
    }, [userCache]);

    const deleteUser = useCallback(async ({userId} = {}) =>
        await deleteUsers({userId}), [deleteUsers]);

    return {
        users,
        user: users,
        loading,
        status, // 4 kinds: info, success, warning, error
        setLoading,
        setStatus,
        fetchUsers,
        fetchUser,
        saveUser,
        saveUserAssignment,
        deleteUsers,
        deleteUser
    };
};

export default useUsers;
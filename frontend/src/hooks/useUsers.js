// FRONTEND/hooks/useUser.js
import { useCallback, useState } from 'react';
import axios from 'axios';
import useApp from '../contexts/AppContext';

const useUsers = () => {
    // internal hooks and states
    const { appCache, showPopUp } = useApp();
    const userCache = appCache.current.users;
    const [ users, setUsers ] = useState();
    const [ loading, setLoading ] = useState();

    // API callbacks
    const fetchUsers = useCallback(async ({userId = null, user_scope = 'all', user_scope_id = null, group = null,
                                              loading = true, reload = false, map = false} = {}) => {

        let users;

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
            showPopUp({type: 'error', content: message});
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

    }, [userCache, showPopUp]);

    const fetchUser = useCallback(async ({userId, reload} = {}) =>
        await fetchUsers({userId, reload}), [fetchUsers]);

    const saveUser = useCallback(async ({userId = null, formData} = {}) => {
        if (!formData)
            return null;

        const newUser = !userId;

        try {
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

            if (data?.message)
                showPopUp({type: 'success', content: data.message});

            return ( data && data.user ) || null;

        } catch(err) {

            console.error('saveUser error:', err);

            const { response } = err;
            let message = 'Error occurred while saving the user data.';
            if (response && response.data)
                message += ' ' + response.data.message;
            message += ' Please try again later.';
            showPopUp({type: 'error', content: message});

            return null;
        }
    }, [showPopUp]);

    const saveUserAssignment = useCallback(async ({ userIds, resource, resourceIds, mode = 'set' }) => {
        if (!userIds || !resourceIds || !resource)
            return null;

        if (!Array.isArray(userIds))
            userIds = Array.from(userIds);

        if (!Array.isArray(resourceIds))
            resourceIds = Array.from(resourceIds);

        if (!userIds.length || !resourceIds.length)
            return null;

        try {

            return await axios.post(
                '/users/assignments',
                {userIds, resource, resourceIds, mode},
                { withCredentials: true }
            );

        } catch (err) {
            console.error('saveUserAssignment error:', err);

            const message = 'Error occurred while saving new User assignments. ' + err.response?.data?.message
            showPopUp({type: 'error', content: message});

            return null;
        }
    }, [showPopUp]);

    const deleteUsers = useCallback(async ({userId, userIds} = {}) => {

        const batchMode = Array.isArray(userIds) && userIds.length > 0;

        try {
            setLoading(true);

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

            if (data?.warning)
                showPopUp({type: 'warning', content: data.warning});

            if (data?.message)
                showPopUp({type: 'success', content: data.message});

            if (batchMode)
                userIds.forEach(userId => delete userCache[userId]);
            else
                delete userCache[userId];

            return true;
        } catch (err) {
            console.error('deleteTeams error:', err);

            const message = 'Failed to delete Team' + (batchMode ? 's' : '') + '. Please try again.';
            showPopUp({type: 'error', content: message});

            return null;
        } finally {
            setLoading(false);
        }
    }, [userCache, showPopUp]);

    const deleteUser = useCallback(async ({userId} = {}) =>
        await deleteUsers({userId}), [deleteUsers]);

    return {
        users,
        user: users,
        loading,
        setLoading,
        fetchUsers,
        fetchUser,
        saveUser,
        saveUserAssignment,
        deleteUsers,
        deleteUser
    };
};

export default useUsers;
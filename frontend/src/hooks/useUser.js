// FRONTEND/hooks/useUser.js
import { useCallback, useRef, useState } from 'react';
import axios from 'axios';

const useUser = () => {
    // All users related states
    const [users, setUsers] = useState(null);
    const [usersLoading, setUsersLoading] = useState(true);

    // All users related callbacks
    const fetchUsers = useCallback(async (type=null, loading=true) => {
        try {
            setUsersLoading(loading);
            let url = '/users';
            if (type === 'employees' || type === 'managers')
                url = url + '?group=' + type;
            const res = await axios.get(url, { withCredentials: true });
            setUsers(res.data);
            return res.data;
        } catch (err) {
            console.error('Error fetching users:', err);
            return null;
        } finally {
            setUsersLoading(false);
        }
    }, []);

    const deleteUsers = useCallback(async (userIds) => {
        try {
            await axios.delete(`/users`, {data: {userIds: Array.from(userIds)}}, { withCredentials: true });
            return true;
        } catch (err) {
            console.error('Error deleting Users:', err);
            return false;
        }
    }, []);

    // Single user related states
    const [user, setUser] = useState(null);
    const userCacheRef = useRef({});
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(null);
    const [warning, setWarning] = useState(null);
    const [error, setError] = useState(null);

    // Single user related callbacks
    const clearNotices = () => {
        setError(null);
        setWarning(null);
        setSuccess(null);
    };

    const fetchUser = useCallback(async (userId, reload = false) => {
        if (!userId) return null;

        if (userCacheRef.current[userId] && !reload) {
            setUser(userCacheRef.current[userId]);
            setLoading(false);
            clearNotices();
            return userCacheRef.current[userId];
        }
        try {
            setLoading(true);
            clearNotices();            
            const res = await axios.get(`/users/${userId}`, { withCredentials: true });
            setUser(res.data);
            userCacheRef.current[userId] = res.data;
            return res.data;
        } catch (err) {
            if (err.status === 404) {
                setError('User not found.');
            } else {
                setError('Error fetching the user.');
                console.error('Error fetching the user:', err);
            }
        } finally {
            setLoading(false);
        }
    }, []);

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

    const deleteUser = useCallback(async (userId) => {
        try {
            setLoading(true);
            clearNotices();
            await axios.delete(`/users/${userId}`, { withCredentials: true });
            setUser(null);
            delete userCacheRef.current[userId];
            return true;
        } catch (err) {
            console.error('Error deleting user:', err);
            setError('Failed to delete user. Please try again.');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        users,
        usersLoading,
        fetchUsers,
        deleteUsers,
        user,
        loading,
        setLoading,
        error,
        warning,
        success,
        fetchUser,
        saveUser,
        saveUserAssignment,
        deleteUser
    };
}
export default useUser;
//FRONTEND:hooks/useUser.js
import {useCallback, useRef, useState} from "react";
import axios from "axios";

const useUser = () => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [success, setSuccess] = useState(null);
    const [warning, setWarning] = useState(null);
    const [error, setError] = useState(null);
    const userCacheRef = useRef({});

    const fetchUser = useCallback(async (userId, reload = false) => {
        if (!userId) return null;

        if (userCacheRef.current[userId] && !reload) {
            setUser(userCacheRef.current[userId]);
            setLoading(false);
            setError(null);
            setWarning(null);
            setSuccess(null);
            return userCacheRef.current[userId];
        }
        try {
            setLoading(true);
            setError(null);
            setWarning(null);
            setSuccess(null);

            let userData;
            let res = await axios.get(`/users/${userId}`, { withCredentials: true });
            if (res.data) {
                userData = res.data;
                res = await axios.get(`/roles/user/${userId}`, { withCredentials: true });
                userData = {
                    ...userData,
                    roles: res.data,
                }
                res = await axios.get(`/users/managers/${userId}`, { withCredentials: true });
                userData = {
                    ...userData,
                    managers: res.data,
                }
                
                setUser(userData);
                userCacheRef.current[userId] = userData;
                return userData;
            } else {
                setError(`User #${userId} not found!`);
                return null;
            }
        } catch (err) {
            console.error('Error fetching user:', err);
            setError('Error occurred while fetching user.');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const saveUser = useCallback(async (formData, userId = null) => {
        const newUser = !userId;
        try {
            setError(null);
            setWarning(null);
            setSuccess(null);

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
                const res = await axios.post('/users/new', userData, { withCredentials: true });
                userId = parseInt(res.data.user?.ID);
            } else {
                await axios.put(`/users/${userId}`, userData, { withCredentials: true });
            }

            await axios.put(`/roles/user/${userId}`, { roleIds: formData.role_ids }, { withCredentials: true });

            if (formData.primary_manager_id && formData.primary_manager_id !== '0') {
                const managerData = [{ manager: parseInt(formData.primary_manager_id), primary: true }];
                if (formData.secondary_manager_id && formData.secondary_manager_id !== '0') {
                    managerData.push({
                        manager: parseInt(formData.secondary_manager_id),
                        primary: false,
                    });
                }
                await axios.put(`/users/managers/${userId}`, { managers: managerData }, { withCredentials: true });
            }

            setSuccess(`User ${newUser? 'created' : 'updated'} successfully.`);
            console.log(`User ${newUser? 'created' : 'updated'} successfully.`);

            return fetchUser(userId, true);

        } catch(err) {
            console.error('Error saving new user data:', err);
            setError('Error occurred while saving new user data.');
            return null;
        } finally {
            setLoading(false);
            setError(null);
            setWarning(null);
            setSuccess(null);
        }
    }, [fetchUser]);

    const deleteUser = useCallback(async (userId) => {
        try {
            setLoading(true);
            setError(null);
            setWarning(null);
            setSuccess(null);
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
            setError(null);
            setWarning(null);
            setSuccess(null);
        }
    }, []);

    return {user, loading, error, warning, success, setLoading, fetchUser, saveUser, deleteUser};
}
export default useUser;
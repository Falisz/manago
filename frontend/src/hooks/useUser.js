//FRONTEND:hooks/useUser.js
import {useCallback, useState} from "react";
import axios from "axios";

const useUser = () => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [userCache, setUserCache] = useState({});

    const fetchUser = useCallback(async (userId, forceLoad = false) => {
        if (userCache[userId] && !forceLoad) {
            setUser(userCache[userId]);
            setLoading(false);
            setError(null);
            setSuccess(null);
            return userCache[userId];
        }
        try {
            setLoading(true);
            setError(null);
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
                setUserCache((prev) => ({ ...prev, [userId]: userData }));
                return userData;
            } else {
                setError('User not found!');
                return null;
            }
        } catch (err) {
            console.error('Error fetching user:', err);
            setError('Error occurred while fetching user.');
            return null;
        } finally {
            setLoading(false);
        }
    }, [userCache]);

    const saveUser = useCallback(async (formData, userId = null) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            let response;

            if (userId) {
                response = await axios.put(`/users/${userId}`, {
                    login: formData.login,
                    email: formData.email,
                    password: formData.password,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    active: formData.active,
                    manager_view_access: formData.manager_view_access
                }, { withCredentials: true });
            } else {
                response = await axios.post('/users/new', formData, { withCredentials: true });
            }

            await axios.put(`/roles/user/${userId}`, { roleIds: formData.role_ids }, { withCredentials: true });

            setSuccess(response.data.message);
            setUser(response.data.user);
            setUserCache((prev) => ({ ...prev, [response.data.user.ID]: response.data.user }));
            return response.data.user;

        } catch(err) {
            console.error('Error fetching user:', err);
            setError('Error occurred while fetching user.');
            return null;
        } finally {
            setLoading(false);
            setError(null);
            setSuccess(null);
        }
    }, []);

    const deleteUser = useCallback(async (userId) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            await axios.delete(`/users/${userId}`, { withCredentials: true });
            setUser(null);
            setUserCache((prev) => {
                const newCache = { ...prev };
                delete newCache[userId];
                return newCache;
            });
            return true;
        } catch (err) {
            console.error('Error deleting user:', err);
            setError('Failed to delete user. Please try again.');
            return false;
        } finally {
            setLoading(false);
            setError(null);
            setSuccess(null);
        }
    }, []);

    return {user, loading, error, success, setLoading, fetchUser, saveUser, deleteUser};
}
export default useUser;
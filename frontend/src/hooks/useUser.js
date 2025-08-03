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
                setUser(userData);
                setUserCache((prev) => ({ ...prev, [userId]: userData }));
                return userData;
            } else {
                setError('User not found!');
                return null;
            }
        } catch (err) {
            console.error('Error fetching role:', err);
            setError('Role not found!');
            return null;
        } finally {
            setLoading(false);
        }
    }, [userCache]);

    const saveUser = useCallback(async (formData, userId = null) => {
        return null;
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
            console.error('Error deleting role:', err);
            setError('Failed to delete role. Please try again.');
            return false;
        } finally {
            setLoading(false);
            setError(null);
            setSuccess(null);
        }
    }, []);

    return {user, loading, error, success, fetchUser, saveUser, deleteUser};
}
export default useUser;
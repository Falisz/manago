//FRONTEND:hooks/useUsers.js
import {useCallback, useState} from "react";
import axios from "axios";

const useUsers = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState(null);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async (loading=true) => {
        try {
            setLoading(loading);
            setError(null);
            const response = await axios.get('/users', { withCredentials: true });
            setUsers(response.data);
            return response.data;
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. Please try again later.');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { users, loading, error, fetchUsers};

};

export default useUsers;
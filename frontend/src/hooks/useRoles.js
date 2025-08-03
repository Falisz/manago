import {useCallback, useState} from "react";
import axios from "axios";

const useRoles = () => {
    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState(null);
    const [error, setError] = useState(null);

    const fetchRoles = useCallback(async (loading=true) => {
        try {
            setLoading(loading);
            setError(null);
            const response = await axios.get('/roles', { withCredentials: true });
            setRoles(response.data);
            return response.data;
        } catch (err) {
            console.error('Error fetching roles:', err);
            setError('Failed to load roles. Please try again later.');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { roles, loading, error, fetchRoles };
};

export default useRoles;
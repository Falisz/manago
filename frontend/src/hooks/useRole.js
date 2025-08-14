//FRONTEND:hooks/useRole.js
import {useCallback, useState} from "react";
import axios from "axios";

const useRole = () => {
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [roleCache, setRoleCache] = useState({});

    const fetchRole = useCallback(async (roleId, forceLoad = false) => {
        if (roleCache[roleId] && !forceLoad) {
            setRole(roleCache[roleId]);
            setLoading(false);
            setError(null);
            setSuccess(null);
            return roleCache[roleId];
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            const res = await axios.get(`/roles/${roleId}`, { withCredentials: true });
            if (res.data) {
                setRole(res.data);
                setRoleCache((prev) => ({ ...prev, [roleId]: res.data }));
                return res.data;
            } else {
                setError('Role not found!');
                return null;
            }
        } catch (err) {
            console.error('Error fetching role:', err);
            setError('Role not found!');
            return null;
        } finally {
            setLoading(false);
        }
    }, [roleCache]);

    const saveRole = useCallback(async (formData, roleId = null) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            let response;
            if (roleId) {
                response = await axios.put(`/roles/${roleId}`, formData, { withCredentials: true });
            } else {
                response = await axios.post('/roles/new', formData, { withCredentials: true });
            }
            setSuccess(response.data.message);
            setRole(response.data.role);
            setRoleCache((prev) => ({ ...prev, [response.data.role.ID]: response.data.role }));
            return response.data.role;
        } catch (err) {
            console.error('Error saving role:', err);
            setError(err.response?.data?.message || 'Failed to save role. Please try again.');
            return null;
        } finally {
            setLoading(false);
            setError(null);
            setSuccess(null);
        }
    }, []);

    const deleteRole = useCallback( async (roleId) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            await axios.delete(`/roles/${roleId}`, { withCredentials: true });
            setRole(null);
            setRoleCache((prev) => {
                const newCache = { ...prev };
                delete newCache[roleId];
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

    return { role, loading, error, success, setLoading, fetchRole, saveRole, deleteRole };
};

export default useRole;
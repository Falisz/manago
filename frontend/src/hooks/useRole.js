// FRONTEND/hooks/useRole.js
import { useCallback, useRef, useState } from 'react';
import axios from 'axios';

const useRole = () => {
    // All roles related states
    const [roles, setRoles] = useState(null);
    const [rolesLoading, setRolesLoading] = useState(true);

    // All roles related callbacks
    const fetchRoles = useCallback(async (loading=true) => {
        try {
            setRolesLoading(loading);
            const res = await axios.get('/roles', { withCredentials: true });
            setRoles(res.data);
            return res.data;
        } catch (err) {
            console.error('Error fetching roles:', err);
            return null;
        } finally {
            setRolesLoading(false);
        }
    }, []);

    // Single role related states
    const [role, setRole] = useState(null);
    const roleCacheRef = useRef({});
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    // Single role related callbacks
    const clearNotices = () => {
        setError(null);
        setSuccess(null);
    };

    const fetchRole = useCallback(async (roleId, reload = false) => {
        if (!roleId) return null;

        if (roleCacheRef.current[roleId] && !reload) {
            setRole(roleCacheRef.current[roleId]);
            setLoading(false);
            clearNotices();
            return roleCacheRef.current[roleId];
        }

        try {
            setLoading(true);
            clearNotices();
            const res = await axios.get(`/roles/${roleId}`, { withCredentials: true });
            setRole(res.data);
            roleCacheRef.current[roleId] = res.data;
            return res.data;
        } catch (err) {
            if (err.status === 404) {
                setError('Role not found.');
            } else {
                setError('Error fetching the role.');
                console.error('Error fetching the role:', err);
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const saveRole = useCallback(async (formData, roleId = null) => {
        const newRole = !roleId;
        try {
            clearNotices();
            let res;
            if (newRole) {
                res = await axios.post('/roles', formData, { withCredentials: true });
                roleId = parseInt(res.data.role?.id);
            } else {
                await axios.put(`/roles/${roleId}`, formData, { withCredentials: true });
            }
            setSuccess(`Role ${newRole? 'created' : 'updated'} successfully.`);

            return fetchRole(roleId, true);
        } catch (err) {
            console.error('Error saving the role:', err);
            setError(err.response?.data?.message || 'Failed to save the role. Please try again.');
            return null;
        }
    }, [fetchRole]);

    const deleteRole = useCallback( async (roleId) => {
        try {
            setLoading(true);
            clearNotices();
            const res = await axios.delete(`/roles/${roleId}`, { withCredentials: true });
            setSuccess(res.data.message);
            setRole(null);
            delete roleCacheRef.current[roleId];
            return true;
        } catch (err) {
            console.error('Error deleting the role:', err);
            setError('Failed to delete the role. Please try again.');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        roles,
        rolesLoading,
        fetchRoles,
        role,
        loading,
        setLoading,
        error,
        success,
        fetchRole,
        saveRole,
        deleteRole
    };
};

export default useRole;
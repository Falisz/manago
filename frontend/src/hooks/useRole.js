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
            const response = await axios.get('/roles', { withCredentials: true });
            setRoles(response.data);
            return response.data;
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
    const fetchRole = useCallback(async (roleId, forceLoad = false) => {
        if (roleCacheRef.current[roleId] && !forceLoad) {
            setRole(roleCacheRef.current[roleId]);
            setLoading(false);
            setError(null);
            setSuccess(null);
            return roleCacheRef.current[roleId];
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            const res = await axios.get(`/roles/${roleId}`, { withCredentials: true });
            if (res.data) {
                setRole(res.data);
                roleCacheRef.current[roleId] = res.data;
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
    }, []);

    const saveRole = useCallback(async (formData, roleId = null) => {
        try {
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
            roleCacheRef.current[response.data.role.id] = response.data.role;
            return response.data.role;
        } catch (err) {
            console.error('Error saving role:', err);
            setError(err.response?.data?.message || 'Failed to save role. Please try again.');
            return null;
        }
    }, []);

    const deleteRole = useCallback( async (roleId) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            await axios.delete(`/roles/${roleId}`, { withCredentials: true });
            setRole(null);
            delete roleCacheRef.current[roleId];
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

    return {
        roles,
        rolesLoading,
        fetchRoles,
        role,
        loading,
        error,
        success,
        setLoading,
        fetchRole,
        saveRole,
        deleteRole
    };
};

export default useRole;
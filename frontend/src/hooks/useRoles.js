// FRONTEND/hooks/useRoles.js
import { useCallback, useState } from 'react';
import axios from 'axios';
import useApp from '../contexts/AppContext';

const useRoles = () => {
    const [roles, setRoles] = useState(null);
    const [status, setStatus] = useState([]);
    const [loading, setLoading] = useState();
    const { appCache } = useApp();
    const roleCache = appCache.current.roles;

    const fetchRoles = useCallback(async ({roleId = null,
                                              loading = true, reload = false, map = false} = {}) => {

        let roles;
        setStatus([]);

        if (roleId && !reload && roleCache[roleId]) {
            setRoles(roleCache[roleId]);
            setLoading(false);
            return roleCache[roleId];
        }

        try {
            setLoading(loading);

            let url = '/roles';

            if (roleId)
                url = `/roles/${roleId}`;

            const res = await axios.get(url, { withCredentials: true });

            if (roleId)
                roleCache[roleId] = res.data;

            roles = res.data;

            if (map) {
                if (!Array.isArray(roles))
                    roles = [roles];
                roles = new Map(
                    roles.map(role => [role.id, role])
                );
            }

        } catch (err) {
            console.error('fetchRoles error:', err);

            const message = 'Error occurred while fetching the Role data.';
            setStatus(prev => [...prev, {status: 'error', message}]);
        }

        setRoles(roles);
        setLoading(false);
        return roles;
        
    }, [roleCache]);

    const fetchRole = useCallback(async ({roleId, reload} = {}) =>
        await fetchRoles({roleId, reload}), [fetchRoles]);

    const saveRole = useCallback(async ({roleId = null, formData} = {}) => {
        if (!formData)
            return null;

        const newRole = !roleId;

        try {
            setStatus([]);

            let res;

            if (newRole)
                res = await axios.post(
                    '/roles',
                    formData,
                    { withCredentials: true }
                );
            else
                res = await axios.put(
                    `/roles/${roleId}`,
                    formData,
                    { withCredentials: true }
                );

            const { data } = res;

            if (data.message)
                setStatus(prev => [...prev, {status: 'success', message: data.message}]);

            return ( data && data.role ) || null;

        } catch (err) {
            console.error('saveRole error:', err);

            const { response } = err;
            let message = 'Error occurred while saving the Role data.';
            if (response && response.data)
                message += ' ' + response.data.message;
            message += ' Please try again later.';
            setStatus(prev => [...prev, {status: 'error', message}]);

            return null;
        }
    }, []);

    const deleteRole = useCallback( async ({roleId} = {}) => {
        try {
            setLoading(true);
            setStatus([]);

            const res = await axios.delete(
                `/roles/${roleId}`,
                { withCredentials: true }
            );

            const { data } = res;

            if (data.warning)
                setStatus(prev => [...prev, {status: 'warning', message: data.warning}]);

            if (data.message)
                setStatus(prev => [...prev, {status: 'success', message: data.message}]);

            delete roleCache[roleId];

            return true;
        } catch (err) {
            console.error('deleteTeams error:', err);

            const message = 'Failed to delete Role. Please try again.';
            setStatus(prev => [...prev, {status: 'error', message}]);

            return null;
        } finally {
            setLoading(false);
        }
    }, [roleCache]);

    return {
        roles,
        role: roles,
        loading,
        status, // 4 kinds: info, success, warning, error
        setLoading,
        setStatus,
        fetchRoles,
        fetchRole,
        saveRole,
        deleteRole
    };
};

export default useRoles;
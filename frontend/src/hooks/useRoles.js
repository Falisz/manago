// FRONTEND/hooks/useRoles.js
import { useCallback, useState } from 'react';
import axios from 'axios';
import useApp from '../contexts/AppContext';
import useNav from '../contexts/NavContext';

const useRoles = () => {
    // internal hooks and states
    const { appCache, showPopUp, refreshData } = useApp();
    const { openModal } = useNav();
    const [roles, setRoles] = useState(null);
    const [loading, setLoading] = useState();
    const roleCache = appCache.current.roles;

    // API callbacks
    const fetchRoles = useCallback(async ({roleId = null,
                                              loading = true, reload = false, map = false} = {}) => {

        let roles;

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
            showPopUp({type: 'error', content: message});
        }

        setRoles(roles);
        setLoading(false);
        return roles;
        
    }, [roleCache, showPopUp]);

    const fetchRole = useCallback(async ({roleId, reload} = {}) =>
        await fetchRoles({roleId, reload}), [fetchRoles]);

    const saveRole = useCallback(async ({roleId = null, formData} = {}) => {
        if (!formData)
            return null;

        const newRole = !roleId;

        try {
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

            if (!data)
                return null;

            // TODO: Test it out.
            if (data?.message)
                showPopUp({
                    type: 'success',
                    content: data.message,
                    onClick: !roleId ? () => openModal({content: 'roleDetails', 
                        contentId: data.id
                    }) : null
                });

            refreshData('roles', true);
            roleId && refreshData('role', roleId);

            return ( data && data.role ) || null;

        } catch (err) {
            console.error('saveRole error:', err);

            const { response } = err;
            let message = 'Error occurred while saving the Role data.';
            if (response && response.data)
                message += ' ' + response.data.message;
            message += ' Please try again later.';
            showPopUp({type: 'error', content: message});

            return null;
        }
    }, [showPopUp, refreshData, openModal]);

    const deleteRole = useCallback( async ({roleId} = {}) => {
        try {
            setLoading(true);

            const res = await axios.delete(
                `/roles/${roleId}`,
                { withCredentials: true }
            );

            const { data } = res;

            if (data.warning)
                showPopUp({type: 'warning', content: data.warning});

            if (data.message)
                showPopUp({type: 'success', content: data.message});

            delete roleCache[roleId];

            refreshData('roles', true);

            return true;
        } catch (err) {
            console.error('deleteTeams error:', err);

            const message = 'Failed to delete Role. Please try again.';
            showPopUp({type: 'error', content: message});

            return null;
        } finally {
            setLoading(false);
        }
    }, [roleCache, showPopUp, refreshData]);

    return {
        roles,
        role: roles,
        loading,
        setLoading,
        fetchRoles,
        fetchRole,
        saveRole,
        deleteRole
    };
};

export default useRoles;
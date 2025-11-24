// FRONTEND/hooks/useResource.js
import {useCallback, useMemo, useState} from 'react';
import useApp from "../contexts/AppContext";
import useNav from "../contexts/NavContext";
import axios from "axios";

// Helper functions to convert camelCase to kebab-case and snake_case
const kebabCase = (str) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
const snakeCase = (str) => str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
const getNames = (str) => ({
    0: str,                                         // singular, lowercase, camelCase
    1: str + 's',                                   // plural, lowercase, camelCase
    2: str[0].toUpperCase() + str.slice(1),         // singular, capitalized, camelCase
    3: str[0].toUpperCase() + str.slice(1) + 's',   // plural, capitalized, camelCase
    4: kebabCase(str),                              // singular, kebab-case
    5: kebabCase(str + 's'),                        // plural, kebab-case
    6: snakeCase(str),                              // singular, snake_case
    7: snakeCase(str + 's')                         // plural, snake_case
});

/**
 * Build a URL based on the provided parameters.
 * @param url_base
 * @param params
 * @param id_required
 * @returns {string|null}
 */
const buildUrl = (url_base = null, params = {}, id_required=false) => {
    if (!url_base) return null;
    const { id, ...flags } = params;
    if (id_required && !id) return null;
    const query = flags ? Object.entries(flags).map(([key, value]) => `${key}=${value}`).join('&') : null;
    return `/${url_base}` + (id ? `/${id}` : '') + (query ? `?${query}` : '');
}
/**
 * Delete a specific team by ID.
 * @param {string | null} name - The plural name of the resource in kebab-case, used for the URL-base
 */
const defaultParams = (name) => ({
    fetchParams: { id: null, loading: true, reload: false, map: false },
    deleteParams: { id: null },
    buildUrl: (params) => buildUrl(name, params),
    buildDeleteUrl: (params) => buildUrl(name, params, true)
});
const resourceConfigs = {
    default: (name) => defaultParams(name),
    user: {
        ...defaultParams('users'),
        fetchParams: { id: null, user_scope: 'all', user_scope_id: null, group: null, loading: true, reload: false,
            map: false },
        buildUrl: (params) => {

            const { id, user_scope, user_scope_id, group } = params;

            let url = '/users';

            if (id) {
                url = `/users/${id}`;
            } else if (user_scope !== 'all' && user_scope_id) {
                if (user_scope === 'manager')
                    url = `/users/${user_scope_id}/managed-users`;

                else if (user_scope === 'team')
                    url = `/teams/${user_scope_id}/users?include_subteams=true`;

                else if (user_scope === 'branch')
                    url = `/branches/${user_scope_id}/users`;

                else if (user_scope === 'project')
                    url = `/projects/${user_scope_id}/users`;
            } else if (user_scope !== 'all' && !user_scope_id) {
                return null;
            } else if (group === 'employees' || group === 'managers') {
                url = `/users?group=${group}`;
            }

            return url;
        }
    },
    team: {
        ...defaultParams('teams'),
        fetchParams: { id: null, all: false, loading: true, reload: false, map: false },
        deleteParams: { id: null, cascade: false },
    },
    leave: {
        ...defaultParams('leaves'),
        fetchParams: { id: null, user: null, user_scope: 'all', user_scope_id: null, date: null, start_date: null,
            end_date: null, loading: true, reload: false, map: false },
        buildUrl: (params) => {

            const { id, user, user_scope, user_scope_id, date, start_date, end_date } = params;
            let url;

            if (id) {
                url = `/leaves/${id}`;
            } else {
                if (user)
                    params.user = user;
                else {
                    if (user_scope)
                        params.user_scope = user_scope;
                    if (user_scope_id)
                        params.user_scope_id = user_scope_id;
                }

                if (date)
                    params.date = date;
                else {
                    if (start_date)
                        params.start_date = start_date;
                    if (end_date)
                        params.end_date = end_date;
                }

                url = '/leaves?' + new URLSearchParams(params).toString();
            }

            return url;
        }
    },
    jobPost: {
        ...defaultParams('job-posts'),
        fetchParams: { id: null, include_shifts: false, loading: true, reload: false, map: false },
    }
};

/**
 * @param resource {string} - The singular name of the resource written with camelCase, used for other names.
 * @returns {Object} - An object containing states and callback to manage the resource data.
 */
const useResource = (resource) => {
    if (!resource || typeof resource !== 'string')
        throw new Error('useResource requires a string resource parameter');

    const { appCache, showPopUp, refreshData } = useApp();
    const { openModal } = useNav();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const name = useMemo(() => getNames(resource), [resource]);
    const resourceCache = useMemo(() => appCache.current[name[1]] || [], [appCache, name]);
    const config = useMemo(() => resourceConfigs[name[0]] || resourceConfigs.default(name[5]), [name]);

    // API callbacks
    const fetchResource = useCallback(async (params = {}) => {

        params = {...config.fetchParams, ...params, loading: params.loading ?? true};

        let result;
        const { id, reload = false, map = false, loading: showLoading } = params;

        if (id && !reload && resourceCache[id]) {
            setData(resourceCache[id]);
            setLoading(false);
            return resourceCache[id];
        }

        try {
            setLoading(showLoading);
            const url = config.buildUrl(params);

            if (!url)
                return null;

            const res = await axios.get(url, { withCredentials: true });

            if (!res) {
                setLoading(false);
                return null;
            }

            result = res.data;
            if (!result) {
                setLoading(false);
                return null;
            }

            if (id)
                resourceCache[id] = result;

            if (map) {
                if (!Array.isArray(result))
                    result = [result];
                result = new Map(result.map(item => [item.id, item]));
            }

        } catch (err) {
            console.error(`fetch${name[id ? 2 : 3]} error:`, err);
            const message = `Error occurred while fetching the ${name[id ? 2 : 3]} data.`;
            showPopUp({ type: 'error', content: message });
        }

        setData(result);
        setLoading(false);
        return result;
    }, [name, config, resourceCache, showPopUp]);

    const saveResource = useCallback(async ({id = null, formData}) => {
        if (!formData)
            return null;

        const isNew = !id;
        const batchMode = Array.isArray(id);

        try {
            let res;
            if (isNew)
                res = await axios.post(config.buildUrl(), formData, { withCredentials: true });
            else if (batchMode)
                res = await axios.put(config.buildUrl(), {ids: id, data: formData}, { withCredentials: true });
            else
                res = await axios.put(config.buildUrl({id}), formData, { withCredentials: true });

            if (!res)
                return null;

            const { data: result } = res;

            if (!result)
                return null;

            if (isNew && result[name[0]])
                id = result[name[0]].id;

            if (Array.isArray(result.warning))
                result.warning.forEach(warn => showPopUp({type: 'warning', content: warn}));
            else if (result.warning && typeof result.warning === 'string')
                showPopUp({type: 'warning', content: result.warning});

            if (result.message)
                showPopUp({
                    type: 'success',
                    content: result.message,
                    onClick: isNew ? () => openModal({content: 'resourceDetails', contentId: id}) : null
                });

            refreshData(name[1], true);
            if (!isNew && !batchMode)
                refreshData(name[0], id);

            return result[name[0]];
        } catch (err) {
            console.error(`save${name[2]} error:`, err);

            const { response } = err;
            let message = `Error occurred while saving the ${name[2]} data.`;
            if (response?.data?.message)
                message += ' ' + response.data.message;
            message += ' Please try again later.';
            showPopUp({type: 'error', content: message});

            return null;
        }
    }, [showPopUp, openModal, refreshData, name, config]);

    const saveResourceAssignment = useCallback(async (params = {}) => {

        params = {...params, mode: params.mode ?? 'set'};

        let { [name[0]+'Ids']: itemIds, resource, resourceIds, mode } = params;

        if (!itemIds || !resource || !resourceIds)
            return null;

        if (itemIds instanceof Set)
            itemIds = Array.from(itemIds);
        else if (!Array.isArray(itemIds))
            itemIds = [itemIds];

        if (resourceIds instanceof Set)
            resourceIds = Array.from(resourceIds);
        else if (!Array.isArray(resourceIds))
            resourceIds = [resourceIds];

        if (!itemIds.length || !resourceIds.length)
            return null;

        try {
            const res = await axios.post(
                config.buildUrl() + '/assignments',
                {[name[0]+'Ids']: itemIds, resource, resourceIds, mode},
                { withCredentials: true }
            )

            if (!res)
                return null;

            const { data: result } = res;

            if (!result)
                return null;

            const { message } = result;

            if (message)
                showPopUp({type: 'success', content: message});

            refreshData(name[1], true);

            return true;

        } catch (err) {
            console.error(`save${name[2]}Assignment error:`, err);

            const message = `Error occurred while saving new ${name[2]} assignments. ` + err.response?.data?.message
            showPopUp({type: 'error', content: message});

            return null;
        }

    }, [showPopUp, refreshData, name, config]);

    const deleteResource = useCallback(async (params = {}) => {

        params = {...config.deleteParams, ...params};

        let { id } = params;

        if (!id)
            return null;

        let batchMode = false;

        if (Array.isArray(id)) {
            id = id.filter(i => i != null);
            batchMode = true;
        } else if (typeof id === 'object' && id instanceof Set) {
            id = Array.from(id).filter(i => i != null);
            batchMode = true;
        } else if (typeof id !== 'number' || Number.isNaN(id)) {
            return null;
        }

        try {

            const url = batchMode ? config.buildUrl() : config.buildDeleteUrl(params);

            if (!url)
                return null;

            const res = batchMode ?
                await axios.delete(url, {data: {data: params}, withCredentials: true}) :
                await axios.delete(url, {withCredentials: true});

            if (!res)
                return null;

            const { data: result } = res;

            if (!result)
                return null;

            const { warning, message, ids } = result;

            if (warning)
                showPopUp({ type: 'warning', content: warning });

            if (message)
                showPopUp({ type: 'success', content: message });

            if (batchMode && ids)
                ids.forEach(i => delete resourceCache[i]);
            else
                delete resourceCache[id];

            refreshData(name[1], true);

            setLoading(false);
            return true;

        } catch (err) {
            console.error(`delete${batchMode ? name[3] : name[2]} error:`, err);

            const message = `Failed to delete ${batchMode ? name[3] : name[2] }. Please try again.`;
            showPopUp({type: 'error', content: message});

            setLoading(false);
            return null;
        }

    }, [showPopUp, refreshData, name, config, resourceCache]);

    return {
        [name[0]]: data,
        [name[1]]: data,
        loading,
        setLoading,
        [`${name[0]}Loading`]: loading,
        [`set${name[2]}Loading`]: setLoading,
        [`fetch${name[2]}`]: fetchResource,
        [`fetch${name[3]}`]: fetchResource,
        [`save${name[2]}`]: saveResource,
        [`save${name[3]}`]: saveResource,
        [`save${name[2]}Assignment`]: saveResourceAssignment,
        [`save${name[3]}Assignment`]: saveResourceAssignment,
        [`delete${name[2]}`]: deleteResource,
        [`delete${name[3]}`]: deleteResource,
    };
};

export const useUsers = () => useResource('user');
export const useRoles = () => useResource('role');
export const useTeams = () => useResource('team');
export const useProjects = () => useResource('project');
export const useBranches = () => useResource('branch');
export const usePermissions = () => useResource('permission');
export const useScheduleDrafts = () => useResource('schedules');
export const useShifts = () => useResource('shift');
export const useLeaves = () => useResource('leave');
export const useJobPosts = () => useResource('jobPost');
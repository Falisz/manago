// FRONTEND/hooks/useResource.js
import {useCallback, useMemo, useState} from 'react';
import useApp from "../contexts/AppContext";
import useNav from "../contexts/NavContext";
import axios from "axios";

// Helper functions to convert camelCase to kebab-case and snake_case
/**
 * Convert camelCase to kebab-case and snake_case.
 * @param str
 * @returns {string}
 */
const kebabCase = (str) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * Convert camelCase to snake_case.
 * @param str
 * @returns {string}
 */
const snakeCase = (str) => str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();

/**
 * Get all possible names for a resource from singular, camelCase name.
 * @param str
 * @returns {Object}
 */
const getNames = (str) => {
    const s = str.endsWith('s') ? 'es' : 's';
    return {
        0: str,                                       // singular, lowercase, camelCase
        1: str + s,                                   // plural, lowercase, camelCase
        2: str[0].toUpperCase() + str.slice(1),       // singular, capitalized, camelCase
        3: str[0].toUpperCase() + str.slice(1) + s,   // plural, capitalized, camelCase
        4: kebabCase(str),                            // singular, kebab-case
        5: kebabCase(str + s),                        // plural, kebab-case
        6: snakeCase(str),                            // singular, snake_case
        7: snakeCase(str + s)                         // plural, snake_case
    }
};

/**
 * Build a URL based on the provided parameters.
 * @param url_base
 * @param params
 * @param id_required
 * @returns {string|null}
 */
const buildUrl = (url_base, params = {}, id_required=false) => {
    if (!url_base) return null;
    const { id, ...flags } = params;
    if (id_required && !id) return null;
    const query = flags ? Object.entries(flags)
        .filter(([key, _value]) => !['key','map','reload','loading'].includes(key))
        .map(([key, value]) => `${key}=${value}`)
        .join('&') : null;
    return `/${url_base}` + (id ? `/${id}` : '') + (query ? `?${query}` : '');
};

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

/**
 * Object with definitions of configurations for each resource.
 */
const resourceConfigs = {
    default: (name) => defaultParams(name),
    shift: {
        ...defaultParams('shifts'),
        fetchParams: { id: null, user: null, user_scope: null, user_scope_id: null, date: null, start_date: null,
            end_date: null, schedule_id: null, job_post: null, location: null, loading: true, reload: false,
            map: false },
        buildUrl: (params = {}) => {

            const { id, user, user_scope, user_scope_id, date, start_date, end_date, schedule_id, job_post,
                location } = params;
            let url = '/shifts';
            let queryParams = {};

            if (id) {
                url = `/shifts/${id}`;
            } else {
                if (date)
                    queryParams.date = date;
                else {
                    if (start_date)
                        queryParams.start_date = start_date;
                    if (end_date)
                        queryParams.end_date = end_date;
                }

                if (user)
                    queryParams.user = user;
                else {
                    if (user_scope)
                        queryParams.user_scope = user_scope;
                    if (user_scope_id)
                        queryParams.user_scope_id = user_scope_id;
                }

                if (schedule_id !== undefined)
                    queryParams.schedule = schedule_id;

                if (job_post)
                    queryParams.job_post = job_post;

                if (location)
                    queryParams.location = location;

                if(Object.keys(queryParams).length)
                    url = '/shifts?' + new URLSearchParams(queryParams).toString();
            }

            return url;
        }
    },
    team: {
        ...defaultParams('teams'),
        fetchParams: { id: null, all: false, user: null, parent: null, subteams: true, members: true, loading: true,
            reload: false, map: false },
        buildUrl: (params = {}) => {

            const { id, all, user, parent, subteams, members } = params;

            let url = '/teams';

            if (id) {
                url = `/teams/${id}`;
            } else {
                const queryParams = {};

                if (all != null)
                    queryParams.all = all;

                if (user != null)
                    queryParams.user = user;

                if (parent != null)
                    queryParams.parent = parent;

                if (subteams != null)
                    queryParams.subteams = subteams;

                if (members != null)
                    queryParams.members = members;

                if(Object.keys(queryParams).length)
                    url = '/teams?' + new URLSearchParams(queryParams).toString();
            }

            return url;
        },
        deleteParams: { id: null, cascade: false }
    },
    user: {
        ...defaultParams('users'),
        fetchParams: { id: null, user_scope: 'all', user_scope_id: null, group: null, loading: true, reload: false,
            map: false },
        buildUrl: (params = {}) => {

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
            } else if (group === 'employees' || group === 'managers') {
                url = `/users?group=${group}`;
            }

            return url;
        }
    },
    leave: {
        ...defaultParams('leaves'),
        fetchParams: { id: null, user: null, user_scope: 'all', user_scope_id: null, date: null, start_date: null,
            end_date: null, loading: true, reload: false, map: false },
        buildUrl: (params = {}) => {

            const { id, user, user_scope, user_scope_id, date, start_date, end_date } = params;
            let url;
            let queryParams = {};

            if (id) {
                url = `/leaves/${id}`;
            } else {
                if (user)
                    queryParams.user = user;
                else {
                    if (user_scope)
                        queryParams.user_scope = user_scope;
                    if (user_scope_id)
                        queryParams.user_scope_id = user_scope_id;
                }

                if (date)
                    queryParams.date = date;
                else {
                    if (start_date)
                        queryParams.start_date = start_date;
                    if (end_date)
                        queryParams.end_date = end_date;
                }

                url = '/leaves?' + new URLSearchParams(queryParams).toString();
            }

            return url;
        },
        otherMethods: {
            fetchLeaveBalance: async ({user} = {}) => {
                const res = await axios.get(`/leaves/balance${user ? '?user=' + user : ''}`)
                return res?.data || null;
            }
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
    /**
     * Fetch a resource by ID and/or additional parameters.
     */
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
            console.log(params, url);

            if (!url)
                return null;

            const res = await axios.get(url);

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

    /**
     * Save data for a resource by ID.
     */
    const saveResource = useCallback(async ({id = null, data}) => {
        if (!data)
            return null;

        const isNew = !id;
        const batchMode = Array.isArray(id);

        try {
            let res;
            if (isNew)
                res = await axios.post(config.buildUrl(), data);
            else if (batchMode)
                res = await axios.put(config.buildUrl(), {ids: id, data: data});
            else
                res = await axios.put(config.buildUrl({id}), data);

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
                    onClick: isNew ? () => openModal({content: 'resourceDetails', contentId: parseInt(id)}) : null
                });

            refreshData(name[1], true);
            if (!isNew && !batchMode) {
                refreshData(name[0], parseInt(id));
                resourceCache[id] = result[name[0]];
            }

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
    }, [showPopUp, openModal, refreshData, name, config, resourceCache]);

    /**
     * Save assignment data for a resource by ID.
     */
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
            const url = config.buildUrl() + '/assignments';
            const res = await axios.post(url, {[name[0]+'Ids']: itemIds, resource, resourceIds, mode})

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

    /**
     * Delete a resource by ID.
     */
    const deleteResource = useCallback(async (params = {}) => {

        params = {...config.deleteParams, ...params};

        let { id } = params;

        if (id == null)
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
                await axios.delete(url, {data: {data: params}}) :
                await axios.delete(url);

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

    const otherMethods = config.otherMethods || {};

    return {
        [name[0]]: data,
        [name[1]]: data,
        [`set${name[2]}`]: setData,
        [`set${name[3]}`]: setData,
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
        ...otherMethods
    };
};

export const useUsers = () => useResource('user');
export const useRoles = () => useResource('role');
export const useTeams = () => useResource('team');
export const useProjects = () => useResource('project');
export const useBranches = () => useResource('branch');
export const usePermissions = () => useResource('permission');
export const useScheduleDrafts = () => useResource('schedule');
export const useShifts = () => useResource('shift');
export const useLeaves = () => useResource('leave');
export const useLeaveTypes = () => useResource('leaveType');
export const useJobPosts = () => useResource('jobPost');
export const useJobLocations = () => useResource('jobLocation');
export const useHolidays = () => useResource('holiday');
export const useRequestStatuses = () => useResource('requestStatus');
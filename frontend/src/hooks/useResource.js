// FRONTEND/hooks/useResource.js
import {useCallback, useMemo, useState} from 'react';
import useApp from "../contexts/AppContext";
import useNav from "../contexts/NavContext";
import axios from "axios";

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
const resourceConfigs = {
    user: { fetchParams: {}, buildUrl: (id) => id ? `/users/${id}` : '/users'},
    role: { fetchParams: {}, buildUrl: (id) => id ? `/roles/${id}` : '/roles'},
    permission: { fetchParams: {}, buildUrl: (id) => id ? `/permissions/${id}` : '/permissions'},
    team: { fetchParams: {}, buildUrl: () => {}},
    shift: { fetchParams: {}, buildUrl: () => {}},
    leave: { fetchParams: {}, buildUrl: () => {}},
    jobPost: { fetchParams: {}, buildUrl: () => {}}
};

// to be taking param resource type:
// - user, team, role, permission, schedule, jobPost, leave, etc.
// - resource is to be a singular camelCase name!
const useResource = (resource) => {
    if (!resource || typeof resource !== 'string')
        throw new Error('useResource requires a string resource parameter');

    const { appCache, showPopUp, refreshData } = useApp();
    const { openModal } = useNav();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const name = useMemo(() => getNames(resource), [resource]);
    const resourceCache = useMemo(() => appCache.current[name[1]] || [], [appCache, name]);
    const config = useMemo(() => resourceConfigs[name[0]] || {
        fetchParams: {},
        deleteParams: {},
        buildUrl: (id) => id ? `/${name[5]}/${id}` : `/${name[5]}`
    }, [name]);

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

        try {
            let res;
            if (isNew)
                res = await axios.post(config.buildUrl(), formData, { withCredentials: true });

            else
                res = await axios.put(config.buildUrl(id), formData, { withCredentials: true });

            if (!res)
                return null;

            const { data: result } = res;

            if (!result)
                return null;

            if (isNew && result[name[0]])
                id = result[name[0]].id;

            if (result.warning)
                showPopUp({type: 'success', content: result.message});

            if (result.message)
                showPopUp({
                    type: 'success',
                    content: result.message,
                    onClick: isNew ? () => openModal({content: 'resourceDetails', contentId: id}) : null
                });

            refreshData(name[1], true);
            if (!isNew)
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
            id = Array.from(id);
            batchMode = true;
        } else if (typeof id !== 'number' || Number.isNaN(id)) {
            return null;
        }

        try {
            let res;

            if (batchMode)
                res = await axios.delete(
                    config.buildUrl(),
                    { data: { id } },
                    { withCredentials: true }
                );
            else
                res = await axios.delete(
                    config.buildUrl(id),
                    { withCredentials: true }
                );

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
        [`fetch${name[2]}`]: fetchResource,
        [`fetch${name[3]}`]: fetchResource,
        [`save${name[2]}`]: saveResource,
        [`save${name[2]}Assignment`]: saveResourceAssignment,
        [`delete${name[2]}`]: deleteResource,
        [`delete${name[3]}`]: deleteResource,
    };
};

export const useUser = () => useResource('user');
export const useRole = () => useResource('role');
export const usePermission = () => useResource('permission');
export const useTeam = () => useResource('team');


export default useResource;



// FRONTEND/contexts/AppCoreContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLoading } from './LoadingContext';
import { useAuth } from './AuthContext';
import componentMap from "../Components";
import InWorks from "../components/InWorks";

const AppCoreContext = createContext();

export const AppCoreProvider = ({ children }) => {
    const { user, access, managerAccess } = useAuth();
    const { setLoading } = useLoading();
    const [modules, setModules] = useState([]);
    const [pages, setPages] = useState(null);
    const [managerView, setManagerView] = useState(false);
    const [didFetch, setDidFetch] = useState(false);

    const fetchModules = useCallback(async () => {
        try {
            const response = await axios.get('/modules', { withCredentials: true });
            setModules(response.data);
        } catch (error) {
            console.error('Error fetching modules:', error);
            setModules([]);
        }
    }, []);

    const toggleModule = useCallback(async (id, enabled) => {
        try {
            await axios.put(`/modules/${id}`, { enabled }, { withCredentials: true });
            await fetchModules();
        } catch (error) {
            console.error('Error toggling module:', error);
        }
    }, [fetchModules]);

    const handleToggle = useCallback(async (moduleId, enabled) => {
        const newEnabled = !enabled;
        if (window.confirm(`Are you sure you want to ${newEnabled ? 'enable' : 'disable'} the module #${moduleId}?`)) {
            await toggleModule(moduleId, newEnabled);
            await refreshPages();
        }
    }, [toggleModule]);

    const refreshPages = useCallback(async () => {
        /**
         * Creates a component using InWorks with the specified title and icon.
         * @param {string} title - The title for the InWorks component.
         * @param {string} icon - The icon for the InWorks component.
         * @returns {Function} A React component function.
         */
        const createInWorksComponent = (title, icon) => {
            return () => <InWorks title={title} icon={icon} />;
        };

        /**
         * Maps page data to include actual components from componentMap, defaulting to an InWorks component if not found.
         * @param {Object[]} pages - Array of page objects from the backend.
         * @returns {Object[]} Array of page objects with mapped components.
         */
        const mapPagesToComponents = (pages) => {
            return pages.map(page => {
                const mappedPage = {
                    ...page,
                    component: componentMap[page.component] || createInWorksComponent(page.title, page.icon)
                };

                if (page.subpages && page.subpages.length > 0) {
                    mappedPage.subpages = mapPagesToComponents(page.subpages);
                }

                return mappedPage;
            });
        };

        try {
            let fetchedPages;
            const res = await axios.get('/pages', { withCredentials: true });

            if (Array.isArray(res.data)) {
                fetchedPages = mapPagesToComponents(res.data);
            } else {
                console.error('Fetched data is not an array:', res.data);
                fetchedPages = [];
            }
            setPages(fetchedPages);
        } catch (error) {
            console.error('Error fetching pages:', error);
            setPages([]);
        }
    }, []);

    const toggleView = useCallback(async (toggleValue) => {
        setLoading(true);
        try {
            const result = await axios.post('/manager-view', { manager_view: toggleValue },
                { withCredentials: true });

            setManagerView(result.data?.manager_view);

            await refreshPages();
        } catch (err) {
            console.error('View switching error: ', err);
        } finally {
            setLoading(false);
        }
    }, [setLoading, refreshPages]);

    useEffect(() => {
        if (user && access && !didFetch) {
            setLoading(true);
            Promise.all([
                fetchModules(),
                (async () => {
                    try {
                        setManagerView(managerAccess && user?.manager_view_enabled);
                        await refreshPages();
                        setDidFetch(true);
                    } catch (err) {
                        console.error('Fetch pages error:', err);
                        setPages([]);
                    }
                })()
            ]).finally(() => setLoading(false));
        }
    }, [user, access, managerAccess, fetchModules, refreshPages, setLoading, didFetch]);

    return (
        <AppCoreContext.Provider value={{ modules, handleToggle, toggleModule, pages, toggleView, managerView, setManagerView, setDidFetch }}>
            {children}
        </AppCoreContext.Provider>
    );
};

export const useAppCore = () => useContext(AppCoreContext);
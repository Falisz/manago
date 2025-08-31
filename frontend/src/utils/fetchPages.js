// FRONTEND/utils/fetchPages.js
import componentMap from "../Components";
import axios from "axios";
import InWorks from "../components/InWorks";

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

/**
 * Fetches pages from the backend and maps their components.
 * @returns {Promise<Object[]>} Array of page objects with mapped components.
 */
const FetchPages = async () => {
    try {
        const res = await axios.get('/pages', { withCredentials: true });
        console.log(res.data);

        if (Array.isArray(res.data)) {
            // Map components to the fetched pages
            return mapPagesToComponents(res.data);
        } else {
            console.error('Fetched data is not an array:', res.data);
            return [];
        }
    } catch (error) {
        console.error('Error fetching pages:', error);
        return [];
    }
};

export default FetchPages;
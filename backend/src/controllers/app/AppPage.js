// BACKEND/controllers/app/AppPage.js
import {AppPage} from '#models';
import {getModules} from '#controllers';

/**
 * Retrieves pages for a user based on their manager view configuration.
 * @param {number} view - 0 for Staff View and 1 for Manager View.
 * @returns {Promise<Object[]>} Array of page objects with nested subpages
 */
export async function getPages(view = 0) {
    const viewKey = view === 1 ? 'manager_view' : 'staff_view';

    const appPage = await AppPage.findOne({ where: { view: viewKey } });
    if (!appPage) {
        return [];
    }

    let pages = appPage.pages;
    const modules = await getModules();
    const moduleStatus = new Map(modules.map(module => [module.id, module.enabled]));

    pages = pages.filter(page => {
        if (!moduleStatus.get(page.module)) {
            return false;
        }
        if (page.subpages && page.subpages.length > 0) {
            page.subpages = page.subpages.filter(subpage =>
                moduleStatus.get(subpage.module !== undefined ? subpage.module : page.module)
            );
        }

        return true;
    });

    return pages;
}
//BACKEND/controllers/api.js
import AppModule from '../models/app-module.js';
import PagesData from '../app-pages.json' with { type: 'json' };
import ConfigData from '../app-config.json' with { type: 'json' };

/**
 * Retrieves all modules sorted by ID in ascending order.
 * @returns {Promise<Object[]>} Array of module objects.
 */
export async function getModules() {
    return await AppModule.findAll({ order: [['id', 'ASC']] });
}

/**
 * Checks if a module is enabled by its ID.
 * @param {number} id - The ID of the module to check.
 * @returns {Promise<boolean>} The enabled status of the module, or false if not found.
 */
export async function checkModule(id) {
    return (await AppModule.findOne({ where: { id } }))?.enabled ?? false;
}

/**
 * Updates the enabled status of a module by its ID.
 * @param {number} id - The ID of the module to update.
 * @param {boolean} value - The new enabled status to set.
 * @returns {Promise<number>} The number of affected rows.
 */
export async function setModule(id, value) {
    return await AppModule.update({ enabled: value }, { where: { id } });
}

/**
 * Retrieves pages for a user based on their manager view configuration.
 * @param {number} view - 0 for Staff View and 1 for Manager View.
 * @returns {Promise<Object[]>} Array of page objects with nested subpages
 */
export async function getPages(view = 0) {
    const key = view === 1 ? 'manager_view' : 'staff_view';
    let pages = JSON.parse(JSON.stringify(PagesData[key]));
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

export async function getConfig() {
    let config = JSON.parse(JSON.stringify(ConfigData['config']));
    return config;
}

export async function setConfig(newConfig) {
    // ConfigData['config'] = { ...ConfigData['config'], ...newConfig };
    console.log(newConfig);
}

export async function getConfigOptions() {
    let options = JSON.parse(JSON.stringify(ConfigData['options']));
    return options;
}
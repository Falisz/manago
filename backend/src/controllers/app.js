//BACKEND/controllers/api.js
import {AppConfig, AppModule, AppPage} from '../models/app.js';

/**
 * Retrieves the current configuration from the database.
 * @returns {Promise<Object>} Configuration object.
 */
export async function getConfig() {
    const configs = await AppConfig.findAll();
    const configObject = {};
    for (const config of configs) {
        configObject[config.configName] = config.selectedOption;
    }
    return configObject;
}

/**
 * Updates the configuration with new values.
 * @param {Object} newConfig - New configuration values.
 * @returns {Promise<void>}
 */
export async function setConfig(newConfig) {
    const configs = await AppConfig.findAll();
    const availableOptions = new Map(configs.map(config => [config.configName, config.options]));

    for (const [configName, value] of Object.entries(newConfig)) {
        if (!availableOptions.has(configName)) {
            throw new Error(`Invalid configuration: ${configName}`);
        }
        if (!availableOptions.get(configName).includes(value)) {
            throw new Error(`Invalid value '${value}' for '${configName}'. Must be one of: 
            ${availableOptions.get(configName).join(', ')}`);
        }
        await AppConfig.update({ selectedOption: value }, { where: { configName } });
    }
}

/**
 * Retrieves all configuration options.
 * @returns {Promise<Object>} Available configuration options.
 */
export async function getConfigOptions() {
    const configs = await AppConfig.findAll();
    const optionsObject = {};
    for (const config of configs) {
        optionsObject[config.configName] = config.options;
    }
    return optionsObject;
}

/**
 * Retrieves all modules sorted by ID in ascending order.
 * @returns {Promise<Object[]>} Array of module objects.
 */
export async function getModules() {
    return await AppModule.findAll({ order: [['id', 'ASC']] });
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
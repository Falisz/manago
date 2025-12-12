// BACKEND/controllers/app/AppConfig.js
import {AppConfig} from '#models';

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
    /** @type {Map<string, string[]>} */
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
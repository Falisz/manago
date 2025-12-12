// BACKEND/utils/isNumberArray.js
import isNumber from '#utils/isNumber.js';

/**
 * Validates if the input is an array of numbers
 * @param {any} value - The value to validate.
 * @returns {boolean} - True if the value is an array of numbers.
 */
export default function isNumberArray(value) {
    return Array.isArray(value) && value.every(isNumber);
}
// BACKEND/utils/isNumberOrNumberArray.js
import isNumber from '#utils/isNumber.js';
import isNumberArray from '#utils/isNumberArray.js';

/**
 * Validates if the input is a number or an array of numbers.
 * @param {any} value - The value to validate.
 * @returns {boolean} - True if the value is a number or an array of numbers.
 */
export default function isNumberOrNumberArray(value) {
    return isNumber(value) || isNumberArray(value);
}
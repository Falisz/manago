// BACKEND/utils/isNumber.js

/**
 * Validates if the input is a number
 * @param {any} value - The value to validate.
 * @returns {boolean} - True if the value is a number.
 */
export default function isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
}
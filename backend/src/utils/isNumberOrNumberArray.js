// BACKEND/utils/isNumberOrNumberArray.js

/**
 * Validates if the input is a number or an array of numbers.
 * @param {number|Array<number>} value - The value to validate. Can be a single number or an array of numbers.
 * @throws Will throw an error if the value is neither a number nor an array of numbers.
 */
export default function isNumberOrNumberArray(value) {
    return (typeof value === 'number' && !isNaN(value)) || 
        (Array.isArray(value) && value.every(item => typeof item === 'number' && !isNaN(item)));
}
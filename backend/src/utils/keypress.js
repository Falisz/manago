// BACKEND/utils/keypress.js
import readline from 'readline';

/**
 * Waits for a specific keypress within a timeout period.
 * @param {string} keyToDetect - The key to detect (e.g., 'space')
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<string|null>} The detected key name or null if timeout occurs
 */
export function waitForKeypress(keyToDetect, timeout) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    return new Promise((resolve) => {
        let keyPressed = false;

        const timeoutId = setTimeout(() => {
            if (!keyPressed) {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                rl.close();
                resolve(null);
            }
        }, timeout);

        process.stdin.on('keypress', (char, key) => {
            if (key && key.name === keyToDetect) {
                keyPressed = true;
                clearTimeout(timeoutId);
                process.stdin.setRawMode(false);
                process.stdin.pause();
                rl.close();
                resolve(key.name);
            }
        });
    });
}
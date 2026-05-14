import crypto from "crypto";

/**
 * Generates a random secure password (letters + numbers + special chars).
 * Guarantees at least one uppercase, one lowercase, one digit, one special char.
 * @param {number} length - Password length (default: 10)
 * @returns {string}
 */
export const generateRandomPassword = (length = 10) => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const special = "!@#$%^&*";
    const all = uppercase + lowercase + digits + special;

    const required = [
        uppercase[crypto.randomInt(uppercase.length)],
        lowercase[crypto.randomInt(lowercase.length)],
        digits[crypto.randomInt(digits.length)],
        special[crypto.randomInt(special.length)],
    ];

    const rest = Array.from({ length: length - required.length }, () =>
        all[crypto.randomInt(all.length)]
    );

    return [...required, ...rest].sort(() => Math.random() - 0.5).join("");
};
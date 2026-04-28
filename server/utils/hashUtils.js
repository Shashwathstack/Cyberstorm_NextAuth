const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

/**
 * Hashes a password using bcrypt.
 * NOTE: The password arriving here is already SHA-256 hashed by the browser,
 * so this applies a second layer of hashing (bcrypt on top of SHA-256).
 * @param {string} password - The SHA-256 hashed password from the client
 * @returns {Promise<string>} The bcrypt hashed string
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain/SHA-256 password with a bcrypt hash.
 * @param {string} password - The incoming password to check
 * @param {string} hash - The bcrypt hash stored in the database
 * @returns {Promise<boolean>} True if they match, false otherwise
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

module.exports = { hashPassword, comparePassword };

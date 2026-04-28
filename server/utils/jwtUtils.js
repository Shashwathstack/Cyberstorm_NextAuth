const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "nexauth-secret";
const JWT_EXPIRES_IN = "7d";

/**
 * Generates a signed JWT token for the given user.
 * @param {{ id: number, email: string }} user
 * @returns {string} Signed JWT token string
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verifies and decodes a JWT token.
 * Throws a JsonWebTokenError if invalid, or TokenExpiredError if expired.
 * @param {string} token
 * @returns {object} Decoded payload
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };

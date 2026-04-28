const { verifyToken } = require("../utils/jwtUtils");
const jwt = require("jsonwebtoken");

/**
 * Express middleware that validates a Bearer JWT token.
 * Attaches the decoded user payload to req.user on success.
 */
function verifyTokenMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, error: "Token expired" });
    }
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
}

module.exports = { verifyToken: verifyTokenMiddleware };

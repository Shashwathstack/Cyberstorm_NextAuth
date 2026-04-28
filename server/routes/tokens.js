const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const { verifyToken } = require("../utils/jwtUtils");
const db = require("../database/db");

// ─────────────────────────────────────────────────────────────
// GET /auth/verify
// Verifies a Bearer JWT token sent in the Authorization header.
// ─────────────────────────────────────────────────────────────
router.get("/verify", (req, res) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ valid: false, reason: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    return res.json({ valid: true, user: decoded });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ valid: false, reason: "expired" });
    }
    return res.status(401).json({ valid: false, reason: "invalid" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /stats
// Returns live stats for the NexAuth dashboard.
// Called every 5 seconds — no auth required.
// ─────────────────────────────────────────────────────────────
router.get("/stats", (req, res) => {
  console.log("📊 Stats requested — returning live data");

  // Pull login attempt log from auth router
  const authRouter = require("./auth");
  const attempts = authRouter.getLoginAttempts();

  const totalLogins = attempts.length;
  const successfulLogins = attempts.filter((a) => a.success).length;
  const failedLogins = totalLogins - successfulLogins;

  // Count distinct API keys (websites) that have registered users
  const apiKeyRow = db
    .prepare("SELECT COUNT(DISTINCT apiKey) AS count FROM users")
    .get();
  const activeWebsites = apiKeyRow ? apiKeyRow.count : 0;

  // "Threats blocked" = failed login attempts (brute-force / bad credentials)
  const threatsBlocked = failedLogins;

  const successRate =
    totalLogins > 0 ? Math.round((successfulLogins / totalLogins) * 100) : 100;

  // Return the 20 most recent attempts for the dashboard feed
  const recentAttempts = attempts.slice(-20).reverse();

  return res.json({
    totalLogins,
    successfulLogins,
    failedLogins,
    threatsBlocked,
    activeWebsites,
    successRate,
    recentAttempts,
  });
});

module.exports = router;

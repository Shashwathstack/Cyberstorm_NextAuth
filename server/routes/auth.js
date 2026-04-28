const express = require("express");
const router = express.Router();

const db = require("../database/db");
const { hashPassword, comparePassword } = require("../utils/hashUtils");
const { generateToken } = require("../utils/jwtUtils");

// ─────────────────────────────────────────────────────────────
// In-memory login attempt log (shared via module reference)
// ─────────────────────────────────────────────────────────────
const loginAttempts = [];

/**
 * Returns the shared login attempts array so index.js / stats
 * can read the same in-memory list.
 */
function getLoginAttempts() {
  return loginAttempts;
}

// ─────────────────────────────────────────────────────────────
// POST /auth/register
// ─────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { email, password, apiKey } = req.body;

  console.log(`📝 Register attempt: ${email}`);

  // 1. Validate inputs
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Email and password are required" });
  }

  if (!apiKey) {
    return res
      .status(400)
      .json({ success: false, error: "API key is required" });
  }

  // 2. Check if email already exists
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email);

  if (existing) {
    console.log(`⚠️  Registration failed — email already exists: ${email}`);
    return res
      .status(409)
      .json({ success: false, error: "Email already exists" });
  }

  try {
    // 3. Double-hash: browser sent SHA-256 hash → we bcrypt it
    const hashedPassword = await hashPassword(password);
    const createdAt = new Date().toISOString();

    // 4. Save to database using parameterised query (no SQL injection)
    db.prepare(
      `INSERT INTO users (email, password, apiKey, createdAt, failedAttempts)
       VALUES (?, ?, ?, ?, 0)`
    ).run(email, hashedPassword, apiKey, createdAt);

    console.log(`✅ User registered successfully: ${email}`);

    // 5. Return success
    return res
      .status(201)
      .json({ success: true, message: "User registered" });
  } catch (err) {
    console.error("❌ Register error:", err.message);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password, apiKey } = req.body;

  // Resolve real IP (respects proxy headers if present)
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";

  console.log(`🔑 Login attempt: ${email} from IP ${ip}`);

  // 1. Validate inputs
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Email and password are required" });
  }

  // 2. Find user — generic error to avoid email-enumeration attacks
  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email);

  const recordAttempt = (success) => {
    loginAttempts.push({
      email,
      ip,
      success,
      timestamp: new Date().toISOString(),
    });
    // Keep only the last 100 attempts in memory
    if (loginAttempts.length > 100) loginAttempts.shift();
  };

  if (!user) {
    // Still run bcrypt to avoid timing-based enumeration
    await comparePassword(password, "$2b$10$invalidhashpaddingtowastetime000000");
    recordAttempt(false);
    console.log(`❌ Login failed — user not found (${email})`);
    return res
      .status(401)
      .json({ success: false, error: "Invalid credentials" });
  }

  // 3. Compare password
  const passwordMatch = await comparePassword(password, user.password);

  if (!passwordMatch) {
    // 4. Increment failed attempt counter
    db.prepare(
      "UPDATE users SET failedAttempts = failedAttempts + 1 WHERE id = ?"
    ).run(user.id);

    recordAttempt(false);
    console.log(`❌ Login failed — wrong password for ${email}`);
    return res
      .status(401)
      .json({ success: false, error: "Invalid credentials" });
  }

  // 5. Correct password — reset counter and issue token
  db.prepare(
    "UPDATE users SET failedAttempts = 0, lastLogin = ? WHERE id = ?"
  ).run(new Date().toISOString(), user.id);

  const token = generateToken({ id: user.id, email: user.email });
  recordAttempt(true);

  console.log(`✅ Login successful — token issued for ${email}`);

  return res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email },
  });
});

module.exports = router;
module.exports.getLoginAttempts = getLoginAttempts;

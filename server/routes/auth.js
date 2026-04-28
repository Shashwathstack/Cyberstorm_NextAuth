const express = require("express");
const router = express.Router();

const db = require("../database/db");
const { hashPassword, comparePassword } = require("../utils/hashUtils");
const { generateToken } = require("../utils/jwtUtils");
const aiMonitor = require("../AI driven detection/aiMonitor");

// Lazy require to avoid circular dependencies if tokens.js also requires auth.js
function broadcastEvent(type, data) {
  require("./tokens").broadcastEvent(type, data);
}

// ─────────────────────────────────────────────────────────────
// In-memory login attempt log (shared via module reference)
// ─────────────────────────────────────────────────────────────
const loginAttempts = [];

function getLoginAttempts() {
  return loginAttempts;
}

// ─────────────────────────────────────────────────────────────
// POST /auth/register
// ─────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { email, password, apiKey } = req.body;
  console.log(`📝 Register attempt: ${email}`);

  if (!email || !password || !apiKey) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ success: false, error: "Email already exists" });
  }

  try {
    const hashedPassword = await hashPassword(password);
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO users (email, password, apiKey, createdAt, failedAttempts, isLocked)
       VALUES (?, ?, ?, ?, 0, 0)`
    ).run(email, hashedPassword, apiKey, createdAt);

    return res.status(201).json({ success: true, message: "User registered" });
  } catch (err) {
    console.error("❌ Register error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  // Now extracting timeToFillFormMs and hashedPassword if sent directly
  const { email, password, hashedPassword, apiKey, timeToFillFormMs } = req.body;
  const passToUse = hashedPassword || password; 

  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress || "unknown";
  console.log(`🔑 Login attempt: ${email} from IP ${ip}`);

  if (!email || !passToUse) {
    return res.status(400).json({ success: false, error: "Email and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  // Helper to record attempt, run AI monitor, and broadcast
  const recordAttempt = (success, emailExists) => {
    // 1. Run AI Engine first
    const aiResult = aiMonitor.checkLogin(
      { ip, headers: req.headers, body: req.body }, 
      success, 
      { emailExists, timeToFillFormMs, country: "US" } // mocking country as US for now
    );

    let isBlocked = false;
    let stepUp = false;

    // 2. Check if AI says to lock the account (Score > 95)
    if (aiResult.action === 'block_and_alert' && user) {
      db.prepare("UPDATE users SET isLocked = 1 WHERE id = ?").run(user.id);
      console.log(`🚨 AI ENGINE LOCKDOWN: Account ${email} has been locked.`);
      stepUp = true;
      isBlocked = true;
    } else if (aiResult.action === 'block' || aiResult.action === 'block_and_alert') {
      isBlocked = true;
    }

    // 3. Record the attempt
    const attempt = {
      id: `l-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email,
      ip,
      success: success && !isBlocked,
      timestamp: new Date().toISOString(),
      country: "US", // mock country
      flagged: aiResult.finalScore > 50,
      riskScore: aiResult.finalScore
    };
    loginAttempts.push(attempt);
    if (loginAttempts.length > 100) loginAttempts.shift();
    
    // Broadcast live event to Dashboard
    broadcastEvent("newAttempt", attempt);

    return { isBlocked, stepUp, aiResult };
  };

  // 1. If user doesn't exist
  if (!user) {
    await comparePassword(passToUse, "$2b$10$invalidhashpaddingtowastetime000000");
    const { isBlocked, stepUp } = recordAttempt(false, false);
    if (stepUp) {
      return res.status(403).json({ success: false, error: "Account Locked. A 2FA recovery link has been sent to your email.", stepUp: true });
    }
    return res.status(401).json({ success: false, error: "Invalid credentials" });
  }

  // 2. Check if account is ALREADY locked
  if (user.isLocked === 1) {
    recordAttempt(false, true);
    return res.status(403).json({ success: false, error: "Account Locked. A 2FA recovery link has been sent to your email.", stepUp: true });
  }

  // 3. Compare password
  const passwordMatch = await comparePassword(passToUse, user.password);

  if (!passwordMatch) {
    db.prepare("UPDATE users SET failedAttempts = failedAttempts + 1 WHERE id = ?").run(user.id);
    const { isBlocked, stepUp } = recordAttempt(false, true);
    
    if (stepUp) {
      return res.status(403).json({ success: false, error: "Account Locked. A 2FA recovery link has been sent to your email.", stepUp: true });
    }
    return res.status(401).json({ success: false, error: "Invalid credentials" });
  }

  // 4. Password is correct. Check AI engine for blocks anyway (e.g., bot detection on valid login)
  const { isBlocked, stepUp, aiResult } = recordAttempt(true, true);
  
  if (stepUp) {
    return res.status(403).json({ success: false, error: "Account Locked due to suspicious activity. A 2FA recovery link has been sent to your email.", stepUp: true });
  }
  if (isBlocked) {
    return res.status(403).json({ success: false, error: "Login blocked due to high security risk." });
  }

  // 5. Success
  db.prepare("UPDATE users SET failedAttempts = 0, lastLogin = ? WHERE id = ?").run(new Date().toISOString(), user.id);
  const token = generateToken({ id: user.id, email: user.email });

  return res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email },
  });
});

module.exports = router;
module.exports.getLoginAttempts = getLoginAttempts;

const path = require("path");
const Database = require("better-sqlite3");

// Resolve the path relative to this file so it works from any CWD
const DB_PATH = path.join(__dirname, "users.db");

let db;

try {
  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");

  // Create users table if it doesn't already exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      email          TEXT    UNIQUE NOT NULL,
      password       TEXT    NOT NULL,
      apiKey         TEXT    NOT NULL,
      createdAt      TEXT    NOT NULL,
      failedAttempts INTEGER DEFAULT 0,
      lastLogin      TEXT,
      isLocked       INTEGER DEFAULT 0
    )
  `);

  // Migrate existing tables safely
  try {
    db.exec('ALTER TABLE users ADD COLUMN isLocked INTEGER DEFAULT 0;');
  } catch (err) {
    // Column likely already exists, ignore error
  }

  console.log("📦 Database connected ✅");
} catch (err) {
  console.error("❌ Database connection failed:", err.message);
  process.exit(1);
}

module.exports = db;

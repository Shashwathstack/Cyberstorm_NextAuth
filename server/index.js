require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const tokenRoutes = require("./routes/tokens");

const app = express();
const PORT = process.env.PORT || 4000;

// ─────────────────────────────────────────────────────────────
// Core middleware
// ─────────────────────────────────────────────────────────────
app.use(cors());           // Allow any origin (plug-and-play SDK)
app.use(express.json());   // Parse JSON request bodies

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);    // POST /auth/register  POST /auth/login
app.use("/auth", tokenRoutes);   // GET  /auth/verify
app.use("/", tokenRoutes);       // GET  /stats

// ─────────────────────────────────────────────────────────────
// 404 handler — catch unknown routes
// ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ─────────────────────────────────────────────────────────────
// Global error handler — server must never crash
// ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {  // eslint-disable-line no-unused-vars
  console.error("🚨 Unhandled error:", err.message);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// ─────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🔐 NexAuth Server Running on port ${PORT}`);
  console.log("💻 Hardware-bound auth is ACTIVE");
  console.log("🤖 AI Engine is ARMED");
});

// ─────────────────────────────────────────────────────────────
// Graceful crash guards — never let the process die silently
// ─────────────────────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  console.error("🚨 Uncaught Exception:", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("🚨 Unhandled Promise Rejection:", reason);
});

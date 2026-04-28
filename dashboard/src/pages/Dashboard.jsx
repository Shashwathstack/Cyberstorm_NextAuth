import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import LiveStats from "../components/LiveStats";
import ThreatLog from "../components/ThreatLog";
import RiskMeter from "../components/RiskMeter";
import LiveFeed from "../components/LiveFeed";
import HashingCard from "../components/HashingCard";

// ── Dummy data generators ────────────────────────────────────────────────────
const ATTACK_TYPES = [
  "SQL Injection",
  "Brute Force",
  "XSS",
  "Credential Stuffing",
  "Bot Traffic",
  "Rate Limit",
];
const COUNTRIES = [
  "🇺🇸 US", "🇷🇺 RU", "🇨🇳 CN", "🇧🇷 BR", "🇩🇪 DE",
  "🇬🇧 GB", "🇫🇷 FR", "🇮🇳 IN", "🇳🇬 NG", "🇰🇵 KP",
];
const EMAILS = [
  "alice@corp.io", "bob@gmail.com", "admin@site.com",
  "root@hack.ru", "test@test.com", "user123@yahoo.com",
  "j.doe@company.net", "attacker@protonmail.com",
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randIp() {
  return `${randInt(1, 254)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`;
}
function randTime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - randInt(0, 59));
  d.setSeconds(randInt(0, 59));
  return d.toLocaleTimeString();
}
function randPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateThreats(n = 20) {
  return Array.from({ length: n }, (_, i) => ({
    id: `t-${Date.now()}-${i}`,
    time: randTime(),
    ip: randIp(),
    attackType: randPick(ATTACK_TYPES),
    country: randPick(COUNTRIES),
    status: Math.random() > 0.3 ? "Blocked" : "Flagged",
  }));
}

function generateLogins(n = 10) {
  return Array.from({ length: n }, (_, i) => ({
    id: `l-${Date.now()}-${i}`,
    email: randPick(EMAILS),
    ip: randIp(),
    country: randPick(COUNTRIES),
    time: randTime(),
    success: Math.random() > 0.35,
    flagged: Math.random() > 0.8,
  }));
}

const DUMMY_STATS = () => ({
  loginsToday: randInt(1800, 2600),
  loginsDelta: randInt(-120, 320),
  threatsBlocked: randInt(140, 310),
  threatsDelta: randInt(0, 45),
  activeWebsites: randInt(28, 42),
  websitesDelta: randInt(0, 3),
  successRate: (randInt(870, 980) / 10).toFixed(1),
  successDelta: (randInt(-5, 12) / 10).toFixed(1),
});

// ── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState(DUMMY_STATS());
  const [threats, setThreats] = useState(generateThreats(24));
  const [logins, setLogins] = useState(generateLogins(10));
  const [riskScore, setRiskScore] = useState(randInt(20, 75));
  const [lastFetch, setLastFetch] = useState(new Date());
  const [backendOnline, setBackendOnline] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await axios.get("http://localhost:4000/stats", {
        timeout: 3000,
      });
      setStats({
        loginsToday: data.loginsToday ?? stats.loginsToday,
        loginsDelta: data.loginsDelta ?? 0,
        threatsBlocked: data.threatsBlocked ?? stats.threatsBlocked,
        threatsDelta: data.threatsDelta ?? 0,
        activeWebsites: data.activeWebsites ?? stats.activeWebsites,
        websitesDelta: data.websitesDelta ?? 0,
        successRate: data.successRate ?? stats.successRate,
        successDelta: data.successDelta ?? 0,
      });
      if (data.threats) setThreats(data.threats);
      if (data.logins) setLogins(data.logins.slice(0, 10));
      if (data.riskScore !== undefined) setRiskScore(data.riskScore);
      setBackendOnline(true);
    } catch (_) {
      // Backend not running — refresh dummy data with slight variation
      setBackendOnline(false);
      setStats(DUMMY_STATS());
      setRiskScore((prev) => {
        const delta = randInt(-6, 6);
        return Math.max(0, Math.min(100, prev + delta));
      });
      // Prepend a new fake login entry
      setLogins((prev) => {
        const newEntry = generateLogins(1)[0];
        newEntry.id = `l-${Date.now()}`;
        newEntry.time = new Date().toLocaleTimeString();
        return [newEntry, ...prev].slice(0, 10);
      });
    }
    setLastFetch(new Date());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 5000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Real-time EventSource listener
  useEffect(() => {
    const sse = new EventSource("http://localhost:4000/stats/live");
    
    sse.onmessage = (e) => {
      const parsed = JSON.parse(e.data);
      
      if (parsed.type === "newAttempt") {
        const attempt = parsed.data;
        
        // Formatted time
        const timeStr = new Date(attempt.timestamp).toLocaleTimeString();
        
        // 1. Prepend to live logins feed
        setLogins(prev => [{
          id: attempt.id,
          email: attempt.email,
          ip: attempt.ip,
          country: attempt.country || "🇺🇸 US",
          time: timeStr,
          success: attempt.success,
          flagged: attempt.flagged
        }, ...prev].slice(0, 10));

        // 2. Prepend to threat log if flagged or blocked
        if (attempt.flagged || !attempt.success) {
          setThreats(prev => [{
            id: attempt.id,
            time: timeStr,
            ip: attempt.ip,
            attackType: attempt.riskScore > 90 ? "Brute Force" : "Bot Traffic",
            country: attempt.country || "🇺🇸 US",
            status: attempt.riskScore > 80 ? "Blocked" : "Flagged"
          }, ...prev].slice(0, 24));
          
          setRiskScore(attempt.riskScore);
        }

        // 3. Increment counters visually for a real-time feel
        setStats(prev => ({
          ...prev,
          loginsToday: prev.loginsToday + 1,
          threatsBlocked: prev.threatsBlocked + (attempt.success ? 0 : 1)
        }));
      } else if (parsed.type === "connected") {
        setBackendOnline(true);
      }
    };

    sse.onerror = () => {
      // Backend probably offline
      setBackendOnline(false);
      sse.close();
      // Try to reconnect in 5s
      setTimeout(() => {
        if (!backendOnline) {
          // simple way to trigger a reload or it will naturally stay off
        }
      }, 5000);
    };

    return () => sse.close();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* ── Top Navbar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 6v6c0 5.25 3.5 10.16 8 11.38C16.5 22.16 20 17.25 20 12V6L12 2z" fill="currentColor" opacity="0.9"/>
                <path d="M9 12l2 2 4-4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white">NexAuth</span>
              <span className="ml-2 text-xs text-gray-600 font-medium hidden sm:inline">Security Dashboard</span>
            </div>
          </div>

          {/* Status row */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
              backendOnline
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : "bg-yellow-500/10 border-yellow-500/25 text-yellow-400"
            }`}>
              <span className="relative flex h-2 w-2">
                <span className={`dot-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${backendOnline ? "bg-emerald-400" : "bg-yellow-400"}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${backendOnline ? "bg-emerald-400" : "bg-yellow-400"}`} />
              </span>
              {backendOnline ? "Backend Online" : "Demo Mode"}
            </div>
            <span className="text-xs text-gray-600 hidden md:block">
              Last sync: {lastFetch.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-8 flex flex-col gap-6">

        {/* Demo mode banner */}
        {!backendOnline && (
          <div className="flex items-center gap-3 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-300">
            <span className="text-base">💡</span>
            <span>
              <strong>Demo Mode</strong> — Backend at{" "}
              <code className="font-mono bg-gray-800 px-1.5 py-0.5 rounded">localhost:4000</code>{" "}
              is offline. Showing live-updating dummy data. All features are functional.
            </span>
          </div>
        )}

        {/* ── Row 1: Stats ── */}
        <section>
          <LiveStats stats={stats} />
        </section>

        {/* ── Row 2: Risk + Hashing ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiskMeter score={Number(riskScore)} />
          <HashingCard />
        </section>

        {/* ── Row 3: Live Feed ── */}
        <section>
          <LiveFeed logins={logins} />
        </section>

        {/* ── Row 4: Threat Log ── */}
        <section>
          <ThreatLog threats={threats} />
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 py-4 px-6">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <span>© 2025 NexAuth · AI-Powered Authentication SDK</span>
          <div className="flex items-center gap-4">
            <a href="http://localhost:5500/sdk/test.html" target="_blank" rel="noreferrer"
               className="hover:text-gray-400 transition-colors">SDK Demo</a>
            <span>·</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

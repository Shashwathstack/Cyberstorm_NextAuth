import React from "react";

const ICONS = {
  logins: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  threats: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  websites: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const DELTA_COLORS = {
  up: "text-emerald-400",
  down: "text-red-400",
  neutral: "text-gray-500",
};

// All classes written in full — Tailwind JIT scans statically, dynamic string
// interpolation like `.replace("text-","bg-")` causes classes to be purged.
const COLOR_MAP = {
  indigo: {
    bg:     "bg-indigo-500/10",
    icon:   "text-indigo-400",
    dot:    "bg-indigo-400",
    border: "border-indigo-500/20",
    glow:   "shadow-indigo-500/10",
  },
  red: {
    bg:     "bg-red-500/10",
    icon:   "text-red-400",
    dot:    "bg-red-400",
    border: "border-red-500/20",
    glow:   "shadow-red-500/10",
  },
  cyan: {
    bg:     "bg-cyan-500/10",
    icon:   "text-cyan-400",
    dot:    "bg-cyan-400",
    border: "border-cyan-500/20",
    glow:   "shadow-cyan-500/10",
  },
  emerald: {
    bg:     "bg-emerald-500/10",
    icon:   "text-emerald-400",
    dot:    "bg-emerald-400",
    border: "border-emerald-500/20",
    glow:   "shadow-emerald-500/10",
  },
};

function StatCard({ title, value, icon, color, delta, deltaLabel, suffix = "" }) {
  const c = COLOR_MAP[color] || COLOR_MAP.indigo;
  const deltaDir = delta > 0 ? "up" : delta < 0 ? "down" : "neutral";

  return (
    <div className={`card p-5 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-0.5 shadow-lg ${c.glow} ${c.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${c.bg} ${c.icon}`}>{icon}</div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span className="stat-value text-gray-50">
          {value}{suffix}
        </span>
        {delta !== undefined && (
          <span className={`text-xs font-semibold pb-1 ${DELTA_COLORS[deltaDir]}`}>
            {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"}{Math.abs(delta)}{deltaLabel}
          </span>
        )}
      </div>

      {/* Live indicator — static dot class from map (JIT-safe) */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className={`dot-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${c.dot}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${c.dot}`} />
        </span>
        <span className="text-xs text-gray-600">Live · updates every 5s</span>
      </div>
    </div>
  );
}

export default function LiveStats({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Total Logins Today"
        value={stats.loginsToday.toLocaleString()}
        icon={ICONS.logins}
        color="indigo"
        delta={stats.loginsDelta}
        deltaLabel=" vs yesterday"
      />
      <StatCard
        title="Threats Blocked"
        value={stats.threatsBlocked.toLocaleString()}
        icon={ICONS.threats}
        color="red"
        delta={stats.threatsDelta}
        deltaLabel=" this hour"
      />
      <StatCard
        title="Active Websites"
        value={stats.activeWebsites}
        icon={ICONS.websites}
        color="cyan"
        delta={stats.websitesDelta}
        deltaLabel=" new"
      />
      <StatCard
        title="Success Rate"
        value={stats.successRate}
        suffix="%"
        icon={ICONS.success}
        color="emerald"
        delta={stats.successDelta}
        deltaLabel="%"
      />
    </div>
  );
}

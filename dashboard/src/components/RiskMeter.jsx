import React, { useEffect, useRef } from "react";

// All color classes written in full so Tailwind JIT includes them.
// Dynamic template strings like `border-${color}-500/25` are purged at build time.
const RISK_LEVELS = {
  safe: {
    label: "Safe",
    hex:   "#10b981",
    track: "bg-emerald-500/15",
    border:"border-emerald-500/25",
    activeBorder: "border-emerald-500/30",
    glow:  "glow-green",
  },
  warning: {
    label: "Warning",
    hex:   "#eab308",
    track: "bg-yellow-500/15",
    border:"border-yellow-500/25",
    activeBorder: "border-yellow-500/30",
    glow:  "glow-yellow",
  },
  danger: {
    label: "Danger",
    hex:   "#ef4444",
    track: "bg-red-500/15",
    border:"border-red-500/25",
    activeBorder: "border-red-500/30",
    glow:  "glow-red",
  },
};

function getRisk(score) {
  if (score <= 33) return RISK_LEVELS.safe;
  if (score <= 66) return RISK_LEVELS.warning;
  return RISK_LEVELS.danger;
}

function AnimatedCounter({ value }) {
  const ref  = useRef(null);
  const prev = useRef(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start     = prev.current;
    const end       = value;
    const duration  = 700;
    const startTime = performance.now();

    function step(now) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(step);
      else prev.current = end;
    }
    requestAnimationFrame(step);
  }, [value]);

  return <span ref={ref}>{value}</span>;
}

const SEGMENTS = [
  { label: "Safe",    from: 0,  to: 33,  dot: "bg-emerald-500" },
  { label: "Warning", from: 34, to: 66,  dot: "bg-yellow-400"  },
  { label: "Danger",  from: 67, to: 100, dot: "bg-red-500"     },
];

export default function RiskMeter({ score }) {
  const risk   = getRisk(score);
  const safeScore = isNaN(score) ? 0 : Math.max(0, Math.min(100, score));

  return (
    <div className={`card p-6 flex flex-col gap-5 ${risk.glow} transition-shadow duration-700`}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <span className="text-lg">⚠️</span> Risk Meter
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Current threat level</p>
        </div>

        {/* Score badge — border + text via inline style (avoids JIT purge) */}
        <div
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl ${risk.track} border`}
          style={{ borderColor: `${risk.hex}40` }}
        >
          <span className="text-2xl font-extrabold" style={{ color: risk.hex }}>
            <AnimatedCounter value={safeScore} />
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">/100</span>
        </div>
      </div>

      {/* ── Status pill ── */}
      <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${risk.track}`}>
        <span className="relative flex h-2.5 w-2.5">
          <span
            className="dot-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: risk.hex }}
          />
          <span
            className="relative inline-flex rounded-full h-2.5 w-2.5"
            style={{ backgroundColor: risk.hex }}
          />
        </span>
        <span className="text-sm font-semibold" style={{ color: risk.hex }}>
          {risk.label}
        </span>
        <span className="text-xs text-gray-500 ml-auto">
          {safeScore <= 33
            ? "System operating normally"
            : safeScore <= 66
            ? "Elevated activity detected"
            : "Immediate attention required"}
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div>
        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full risk-bar-inner rounded-full transition-all duration-700 ease-out relative overflow-hidden"
            style={{
              width: `${safeScore}%`,
              background: `linear-gradient(90deg, #10b981, ${risk.hex})`,
              boxShadow: `0 0 12px ${risk.hex}55`,
            }}
          >
            {/* Shimmer layer */}
            <div
              className="absolute inset-y-0 w-1/3"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                animation: "shimmer 2s infinite",
              }}
            />
          </div>
        </div>
        <div className="flex justify-between mt-1.5">
          {[0, 25, 50, 75, 100].map((v) => (
            <span key={v} className="text-[10px] text-gray-600">{v}</span>
          ))}
        </div>
      </div>

      {/* ── Segment legend ── */}
      <div className="grid grid-cols-3 gap-2">
        {SEGMENTS.map((seg) => {
          const active = safeScore >= seg.from && safeScore <= seg.to;
          return (
            <div
              key={seg.label}
              className={`flex flex-col items-center p-2.5 rounded-xl border transition-all ${
                active ? `${risk.track}` : "bg-gray-800/40 border-gray-800"
              }`}
              style={active ? { borderColor: `${risk.hex}40` } : {}}
            >
              <div
                className={`w-3 h-3 rounded-full mb-1.5 ${seg.dot} ${active ? "ring-2 ring-offset-1 ring-offset-gray-900" : "opacity-40"}`}
                style={active ? { ringColor: risk.hex } : {}}
              />
              <span
                className={`text-[11px] font-semibold ${active ? "" : "text-gray-600"}`}
                style={active ? { color: risk.hex } : {}}
              >
                {seg.label}
              </span>
              <span className="text-[10px] text-gray-600">
                {seg.from}–{seg.to}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}

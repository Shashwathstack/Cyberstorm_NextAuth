import React from "react";

export default function LiveFeed({ logins }) {
  return (
    <div className="card p-0 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div>
          <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <span className="text-lg">📡</span> Live Login Feed
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Last 10 authentication attempts</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
          <span className="relative flex h-2 w-2">
            <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400" />
          </span>
          <span className="text-xs text-indigo-400 font-semibold">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-800/50 max-h-96">
        {logins.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-600 text-sm">No login attempts yet…</div>
        )}
        {logins.map((entry, i) => (
          <div
            key={entry.id || i}
            className="feed-entry flex items-center gap-4 px-6 py-3.5 hover:bg-gray-800/25 transition-colors"
          >
            <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
              entry.success ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
            }`}>
              {entry.success ? "✓" : "✕"}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-200 truncate max-w-[180px]">{entry.email}</span>
                <span className={`badge text-[11px] ${
                  entry.success ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                }`}>
                  {entry.success ? "✓ Pass" : "✕ Fail"}
                </span>
                {entry.flagged && (
                  <span className="badge bg-yellow-500/15 text-yellow-400 text-[11px]">⚠ Flagged</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                <span className="font-mono">{entry.ip}</span>
                <span>·</span>
                <span>{entry.country}</span>
              </div>
            </div>

            <div className="flex-shrink-0 text-right">
              <span className="text-xs text-gray-500 font-mono">{entry.time}</span>
              {i === 0 && <div className="text-[10px] text-indigo-400 mt-0.5 font-semibold">Latest</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-3 border-t border-gray-800 flex items-center justify-between">
        <span className="text-xs text-gray-600">Showing {logins.length} most recent</span>
        <span className="text-xs text-gray-600">Refreshes every 5s</span>
      </div>
    </div>
  );
}

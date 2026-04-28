import React, { useState } from "react";

const ATTACK_COLORS = {
  "SQL Injection":   { bg: "bg-red-500/15",    text: "text-red-400",    dot: "bg-red-400" },
  "Brute Force":     { bg: "bg-orange-500/15",  text: "text-orange-400", dot: "bg-orange-400" },
  "XSS":            { bg: "bg-yellow-500/15",  text: "text-yellow-400", dot: "bg-yellow-400" },
  "Credential Stuffing": { bg: "bg-purple-500/15", text: "text-purple-400", dot: "bg-purple-400" },
  "Bot Traffic":    { bg: "bg-blue-500/15",    text: "text-blue-400",   dot: "bg-blue-400" },
  "Rate Limit":     { bg: "bg-cyan-500/15",    text: "text-cyan-400",   dot: "bg-cyan-400" },
};

function AttackBadge({ type }) {
  const c = ATTACK_COLORS[type] || { bg: "bg-gray-800", text: "text-gray-400", dot: "bg-gray-400" };
  return (
    <span className={`badge ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {type}
    </span>
  );
}

function StatusBadge({ status }) {
  if (status === "Blocked")
    return (
      <span className="badge bg-red-500/15 text-red-400 border border-red-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Blocked
      </span>
    );
  return (
    <span className="badge bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 dot-ping" />
      Flagged
    </span>
  );
}

const PAGE_SIZE = 8;

export default function ThreatLog({ threats }) {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("All");

  const types = ["All", ...Object.keys(ATTACK_COLORS)];

  const filtered =
    filter === "All" ? threats : threats.filter((t) => t.attackType === filter);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-800">
        <div>
          <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <span className="text-lg">🛡️</span> Threat Log
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} events detected
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => { setFilter(t); setPage(0); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filter === t
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800/60">
              {["Time", "IP Address", "Attack Type", "Country", "Status"].map((h) => (
                <th
                  key={h}
                  className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-widest"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={row.id || i}
                className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-6 py-3.5 text-gray-400 font-mono text-xs whitespace-nowrap">
                  {row.time}
                </td>
                <td className="px-6 py-3.5 text-gray-300 font-mono text-xs">
                  {row.ip}
                </td>
                <td className="px-6 py-3.5">
                  <AttackBadge type={row.attackType} />
                </td>
                <td className="px-6 py-3.5 text-gray-400 text-xs">
                  {row.country}
                </td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-600 text-sm">
                  No threats match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800">
          <span className="text-xs text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-400 disabled:opacity-30 hover:bg-gray-700 transition-colors"
            >
              ← Prev
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-400 disabled:opacity-30 hover:bg-gray-700 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

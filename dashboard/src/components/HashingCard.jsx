import React, { useState, useEffect } from "react";

export default function HashingCard() {
  const [hashData, setHashData] = useState(null);
  const [visible, setVisible] = useState(false);

  // Poll localStorage for fresh hash written by the SDK
  useEffect(() => {
    function check() {
      try {
        const raw = localStorage.getItem("nexauth_last_hash");
        if (raw) {
          const parsed = JSON.parse(raw);
          setHashData(parsed);
          setVisible(true);
        }
      } catch (_) {}
    }
    check();
    const id = setInterval(check, 1500);
    return () => clearInterval(id);
  }, []);

  // Truncate hash for display
  const shortHash = hashData
    ? hashData.hash.slice(0, 16) + "…" + hashData.hash.slice(-8)
    : null;

  return (
    <div className="card p-6 flex flex-col gap-4 border-emerald-500/20 shadow-emerald-500/10 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <span className="text-lg">🔐</span> Hashing Proof
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            SHA-256 browser-side hashing · Web Crypto API
          </p>
        </div>
        <div className="px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
          <span className="text-xs text-emerald-400 font-semibold">✅ Active</span>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-800/50 border border-gray-800 rounded-xl p-4 text-xs text-gray-400 leading-relaxed">
        <div className="text-gray-300 font-semibold mb-2 text-[13px]">How NexAuth protects passwords:</div>
        <div className="flex flex-col gap-2">
          {[
            { icon: "1️⃣", text: "User types password in browser" },
            { icon: "2️⃣", text: "SDK hashes it with SHA-256 via Web Crypto API" },
            { icon: "3️⃣", text: "Only the hex hash is sent over the network" },
            { icon: "4️⃣", text: "Raw password never leaves the device — ever" },
          ].map((step) => (
            <div key={step.icon} className="flex items-start gap-2">
              <span>{step.icon}</span>
              <span>{step.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Last hash proof */}
      {visible && hashData ? (
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            Last Login Hash Proof
          </div>

          <div className="flex flex-col gap-2">
            {/* Email */}
            <div className="flex items-center justify-between bg-gray-800/60 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-500">Email</span>
              <span className="text-xs text-gray-200 font-medium truncate max-w-[200px]">
                {hashData.email}
              </span>
            </div>

            {/* Hash */}
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5">
                SHA-256 Hash (what was sent to server)
              </div>
              <div className="font-mono text-[11px] text-cyan-400 break-all leading-relaxed">
                {hashData.hash}
              </div>
            </div>

            {/* Raw password status */}
            <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2.5">
              <span className="text-base">✅</span>
              <div>
                <div className="text-xs font-semibold text-emerald-400">
                  Raw password: never stored, never sent
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Hashed at{" "}
                  {new Date(hashData.time).toLocaleTimeString()} ·{" "}
                  {shortHash}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center text-2xl">
            🔒
          </div>
          <div>
            <div className="text-sm text-gray-400 font-medium">No login recorded yet</div>
            <div className="text-xs text-gray-600 mt-1">
              Open the SDK test page and sign in to see the hash proof here.
            </div>
          </div>
          <a
            href="http://localhost:5500/sdk/test.html"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
          >
            Open SDK Demo →
          </a>
        </div>
      )}
    </div>
  );
}

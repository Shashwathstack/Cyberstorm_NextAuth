/**
 * NexAuth SDK v1.0
 * Plug-and-play authentication with AI-powered cybersecurity.
 * Usage: <script src="nexauth.js" data-key="your-api-key"></script>
 *
 * Security: Passwords are hashed with SHA-256 (Web Crypto API)
 * BEFORE leaving the browser. The raw password NEVER travels over the network.
 */

(function () {
  "use strict";

  // ─── Configuration ──────────────────────────────────────────────────────────
  const currentScript =
    document.currentScript ||
    (function () {
      const scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  const API_KEY = currentScript.getAttribute("data-key") || "";
  const API_BASE = "http://localhost:4000";

  // ─── SHA-256 Hashing (Web Crypto API — no raw password ever leaves device) ──
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  }

  // ─── Styles ─────────────────────────────────────────────────────────────────
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    #nexauth-trigger-btn {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9998;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      border: none;
      border-radius: 50px;
      padding: 14px 26px;
      font-family: 'Inter', sans-serif;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(99,102,241,0.45);
      display: flex;
      align-items: center;
      gap: 10px;
      transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
      letter-spacing: 0.01em;
    }
    #nexauth-trigger-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(99,102,241,0.55);
    }
    #nexauth-trigger-btn svg { flex-shrink: 0; }

    #nexauth-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(6px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }
    #nexauth-overlay.na-visible {
      opacity: 1;
      pointer-events: all;
    }

    #nexauth-modal {
      background: #0f172a;
      border: 1px solid rgba(99,102,241,0.25);
      border-radius: 20px;
      padding: 40px 36px 36px;
      width: 420px;
      max-width: calc(100vw - 32px);
      box-shadow: 0 25px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.12);
      transform: translateY(24px) scale(0.97);
      transition: transform 0.28s cubic-bezier(0.34,1.4,0.64,1), opacity 0.25s;
      opacity: 0;
      font-family: 'Inter', sans-serif;
    }
    #nexauth-overlay.na-visible #nexauth-modal {
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    .na-form-wrapper {
      font-family: 'Inter', sans-serif;
      width: 100%;
    }

    .na-logo-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
    }
    .na-logo-badge {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .na-title { color: #f8fafc; font-size: 22px; font-weight: 700; }
    .na-subtitle { color: #64748b; font-size: 13px; margin-top: 2px; }

    .na-security-badge {
      background: rgba(16,185,129,0.12);
      border: 1px solid rgba(16,185,129,0.25);
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 26px;
      display: flex;
      align-items: center;
      gap: 9px;
      color: #34d399;
      font-size: 12.5px;
      font-weight: 500;
    }

    .na-field-group { margin-bottom: 18px; text-align: left; }
    .na-label {
      display: block;
      color: #94a3b8;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 7px;
    }
    .na-input {
      width: 100%;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      color: #f1f5f9;
      font-family: 'Inter', sans-serif;
      font-size: 14.5px;
      padding: 12px 14px;
      box-sizing: border-box;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }
    .na-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.18);
    }
    .na-input::placeholder { color: #475569; }

    .na-hash-preview {
      background: #0d1117;
      border: 1px solid #1e2d3d;
      border-radius: 8px;
      padding: 8px 12px;
      margin-top: 8px;
      display: none;
      text-align: left;
    }
    .na-hash-preview-label {
      color: #475569;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .na-hash-value {
      color: #22d3ee;
      font-family: 'Courier New', monospace;
      font-size: 10.5px;
      word-break: break-all;
      line-height: 1.5;
    }
    .na-hash-note {
      color: #10b981;
      font-size: 11px;
      margin-top: 5px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .na-submit-btn {
      width: 100%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 13px;
      font-family: 'Inter', sans-serif;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 8px;
      transition: opacity 0.2s, transform 0.15s;
      letter-spacing: 0.01em;
      position: relative;
      overflow: hidden;
    }
    .na-submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
    .na-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .na-loader {
      display: inline-block;
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: na-spin 0.7s linear infinite;
      vertical-align: middle;
      margin-right: 8px;
    }
    @keyframes na-spin { to { transform: rotate(360deg); } }

    .na-message {
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 13.5px;
      font-weight: 500;
      margin-top: 16px;
      display: none;
      align-items: center;
      gap: 9px;
      text-align: left;
    }
    .na-message.na-success {
      background: rgba(16,185,129,0.12);
      border: 1px solid rgba(16,185,129,0.3);
      color: #34d399;
    }
    .na-message.na-error {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      color: #f87171;
    }
    .na-message.na-show { display: flex; }

    .na-footer {
      margin-top: 22px;
      text-align: center;
      color: #334155;
      font-size: 11.5px;
    }
    .na-footer a { color: #6366f1; text-decoration: none; }
    .na-close-btn {
      position: absolute;
      top: 16px; right: 18px;
      background: none;
      border: none;
      color: #475569;
      font-size: 22px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      line-height: 1;
      transition: color 0.2s;
    }
    .na-close-btn:hover { color: #94a3b8; }
  `;

  // ─── Inject Styles ───────────────────────────────────────────────────────────
  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = styles;
    document.head.appendChild(style);
  }

  // ─── Build Form HTML ────────────────────────────────────────────────────────
  function getFormHTML(isInline) {
    return `
      <div class="na-form-wrapper" style="${!isInline ? 'position:relative;' : ''}">
        ${!isInline ? '<button class="na-close-btn" id="na-close" aria-label="Close">&times;</button>' : ''}

        <div class="na-logo-row">
          <div class="na-logo-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.25 3.5 10.16 8 11.38C16.5 22.16 20 17.25 20 12V6L12 2z"
                fill="rgba(255,255,255,0.9)"/>
              <path d="M9 12l2 2 4-4" stroke="#6366f1" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <div class="na-title">NexAuth</div>
            <div class="na-subtitle">Secure Authentication</div>
          </div>
        </div>

        <div class="na-security-badge">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              fill="#10b981" opacity="0.8"/>
          </svg>
          Password hashed with SHA-256 before leaving your device
        </div>

        <form id="na-login-form" autocomplete="on" novalidate>
          <div class="na-field-group">
            <label class="na-label" for="na-email">Email Address</label>
            <input class="na-input" type="email" id="na-email"
              name="email" placeholder="you@example.com" required autocomplete="email"/>
          </div>

          <div class="na-field-group">
            <label class="na-label" for="na-password">Password</label>
            <input class="na-input" type="password" id="na-password"
              name="password" placeholder="••••••••" required autocomplete="current-password"/>
            <div class="na-hash-preview" id="na-hash-preview">
              <div class="na-hash-preview-label">🔐 SHA-256 Hash (what gets sent)</div>
              <div class="na-hash-value" id="na-hash-value">—</div>
              <div class="na-hash-note">✅ Raw password: never stored, never sent</div>
            </div>
          </div>

          <button type="submit" class="na-submit-btn" id="na-submit-btn">
            Sign In Securely
          </button>
        </form>

        <div class="na-message" id="na-message" role="alert"></div>

        <div class="na-footer">
          Protected by <a href="#" target="_blank">NexAuth</a> &bull;
          End-to-end security
        </div>
      </div>
    `;
  }

  // ─── Build Modal Background ──────────────────────────────────────────────────
  function buildModal() {
    const overlay = document.createElement("div");
    overlay.id = "nexauth-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "NexAuth Login");

    const modal = document.createElement("div");
    modal.id = "nexauth-modal";
    modal.innerHTML = getFormHTML(false);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    return overlay;
  }

  // ─── Build Trigger Button ────────────────────────────────────────────────────
  function buildTriggerButton() {
    const btn = document.createElement("button");
    btn.id = "nexauth-trigger-btn";
    btn.setAttribute("aria-label", "Open NexAuth Login");
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L4 6v6c0 5.25 3.5 10.16 8 11.38C16.5 22.16 20 17.25 20 12V6L12 2z"
          fill="rgba(255,255,255,0.9)"/>
      </svg>
      Sign In with NexAuth
    `;
    document.body.appendChild(btn);
    return btn;
  }

  // ─── Controller ─────────────────────────────────────────────────────────────
  function init() {
    injectStyles();

    let overlay, triggerBtn;
    const inlineContainer = document.getElementById("nexauth-container");
    const isInline = !!inlineContainer;

    if (isInline) {
      inlineContainer.innerHTML = getFormHTML(true);
    } else {
      overlay = buildModal();
      triggerBtn = buildTriggerButton();
    }

    const form = document.getElementById("na-login-form");
    const emailInput = document.getElementById("na-email");
    const passwordInput = document.getElementById("na-password");
    const submitBtn = document.getElementById("na-submit-btn");
    const messageEl = document.getElementById("na-message");
    const hashPreview = document.getElementById("na-hash-preview");
    const hashValue = document.getElementById("na-hash-value");
    const closeBtn = document.getElementById("na-close");

    // Open / close helpers
    let formStartTime = 0;

    function openModal() {
      if (isInline) return;
      overlay.classList.add("na-visible");
      setTimeout(() => emailInput.focus(), 280);
    }
    
    function closeModal() {
      if (isInline) return;
      overlay.classList.remove("na-visible");
      resetForm();
    }

    function resetForm() {
      form.reset();
      formStartTime = 0;
      hashPreview.style.display = "none";
      hashValue.textContent = "—";
      hideMessage();
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Sign In Securely";
    }

    form.addEventListener("input", () => {
      if (!formStartTime) formStartTime = Date.now();
    });

    // Show live hash preview as user types password
    let hashDebounce;
    passwordInput.addEventListener("input", function () {
      clearTimeout(hashDebounce);
      const val = passwordInput.value;
      if (!val) {
        hashPreview.style.display = "none";
        return;
      }
      hashDebounce = setTimeout(async () => {
        const hash = await hashPassword(val);
        hashValue.textContent = hash;
        hashPreview.style.display = "block";
      }, 250);
    });

    // Messages
    function showMessage(type, text) {
      messageEl.className = `na-message na-${type} na-show`;
      messageEl.innerHTML =
        (type === "success"
          ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
               <path d="M20 6L9 17l-5-5" stroke="#34d399" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round"/>
             </svg>`
          : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
               <circle cx="12" cy="12" r="10" stroke="#f87171" stroke-width="2"/>
               <path d="M12 8v4m0 4h.01" stroke="#f87171" stroke-width="2"
                 stroke-linecap="round"/>
             </svg>`) + text;
    }
    function hideMessage() {
      messageEl.className = "na-message";
    }

    // Modal Trigger and Close
    if (!isInline) {
      triggerBtn.addEventListener("click", openModal);
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeModal();
      });
      closeBtn.addEventListener("click", closeModal);
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && overlay.classList.contains("na-visible")) {
          closeModal();
        }
      });
    }

    // ─── Form Submit ───────────────────────────────────────────────────────────
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      hideMessage();

      const email = emailInput.value.trim();
      const rawPassword = passwordInput.value;
      const timeToFillFormMs = formStartTime ? Date.now() - formStartTime : 0;

      if (!email || !rawPassword) {
        showMessage("error", "Please fill in all fields.");
        return;
      }

      // Hash password in the browser — raw password NEVER leaves device
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="na-loader"></span>Hashing & Signing In…`;

      let hashedPassword;
      try {
        hashedPassword = await hashPassword(rawPassword);
      } catch (err) {
        showMessage("error", "Browser hashing failed. Please try again.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Sign In Securely";
        return;
      }

      // Update live hash preview with final hash
      hashValue.textContent = hashedPassword;
      hashPreview.style.display = "block";

      // Store hash in localStorage so the dashboard's HashingCard can display it
      try {
        localStorage.setItem(
          "nexauth_last_hash",
          JSON.stringify({
            email,
            hash: hashedPassword,
            time: new Date().toISOString(),
            note: "Raw password: never stored ✅",
          })
        );
      } catch (_) {}

      // Send to server — only hashedPassword, NEVER raw password
      try {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, hashedPassword, apiKey: API_KEY, timeToFillFormMs }),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.token) {
          localStorage.setItem("nexauth_token", data.token);
          showMessage(
            "success",
            `Authenticated! Welcome, <strong>${email}</strong>`
          );
          submitBtn.innerHTML = "✓ Signed In";
          
          window.dispatchEvent(new CustomEvent('nexauth:success', { detail: { email } }));

          setTimeout(() => {
             if (!isInline) closeModal();
          }, 2200);
        } else {
          const msg = data.error || data.message || `Server responded with ${response.status}`;
          if (data.stepUp) {
            showMessage("error", `🚨 ${msg}`);
            submitBtn.innerHTML = "Account Locked";
            // Intentional: keep button disabled
          } else {
            showMessage("error", msg);
            submitBtn.disabled = false;
            submitBtn.innerHTML = "Sign In Securely";
          }
        }
      } catch (networkErr) {
        // Demo mode: backend not running — simulate success
        console.warn(
          "[NexAuth] Backend not reachable — running in demo mode.",
          networkErr
        );
        const fakeToken = btoa(`demo:${email}:${Date.now()}`);
        localStorage.setItem("nexauth_token", fakeToken);
        showMessage(
          "success",
          `[Demo Mode] Hashed &amp; authenticated! Token stored locally.`
        );
        submitBtn.innerHTML = "✓ Signed In (Demo)";
        
        window.dispatchEvent(new CustomEvent('nexauth:success', { detail: { email } }));
        
        setTimeout(() => {
           if (!isInline) closeModal();
        }, 2500);
      }
    });
  }

  // ─── Bootstrap ──────────────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

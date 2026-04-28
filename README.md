# NexAuth (Cyberstorm_NextAuth)

<img width="1146" height="606" alt="image" src="https://github.com/user-attachments/assets/d22dbb36-e29c-4aaa-98ff-71f989c704ba" />

NexAuth is a plug-and-play authentication SDK with a Node/Express backend,
SQLite storage, a rules-based threat detection engine, and a React dashboard
for live monitoring.

## What is in this repo

- SDK script that injects a login UI and hashes passwords in-browser
- Express API for register/login/JWT verification
- Rule-based threat detection (no external ML models)
- React dashboard with live stats and SSE feed
- Demo pages to validate the end-to-end flow

## Repository layout

- server/ - Express API, SQLite database, AI detection modules
- dashboard/ - React admin dashboard (Create React App)
- sdk/ - source SDK and a local test page
- dashboard/public/nexauth.js - SDK copy served by the dashboard dev server
- demo/ - static demo pages that include the SDK
- config/.env.example - environment template
- docs/ - integration guide

## How the system works

1. A website includes the SDK from the dashboard dev server
	(http://localhost:3000/nexauth.js) with a data-key.
2. The SDK injects a login UI and hashes the password in the browser
	 using the Web Crypto API (SHA-256).
3. The SDK sends { email, hashedPassword, apiKey } to the backend.
4. The backend bcrypt-hashes the SHA-256 hash and validates credentials
	 against SQLite.
5. The AI monitor evaluates the request using rules (failed attempts,
	 user-agent signals, request frequency, anomaly signals).
6. Each login attempt is broadcast over SSE (/stats/live), and the
	 dashboard updates the live feed in real time.
7. On success, the backend returns a JWT; the SDK stores it in localStorage.

## AI/ML dependencies (external)

- No Python, scikit-learn, or external model files are required.
- No external AI services (OpenAI, Anthropic, etc) are used.
- The AI engine is implemented in server/AI driven detection as
	deterministic JavaScript rules.
- Optional external network use: Google Fonts CDN (used in SDK/demo pages).

## Requirements

- Node.js 20+ (better-sqlite3 ships prebuilds for Node 20+)
- npm (bundled with Node)

## Setup

Windows (PowerShell):

```powershell
Set-Location "c:\Users\ASUS\Desktop\Cyberstorm_NextAuth"
npm install --prefix server
npm install --prefix dashboard
if (!(Test-Path .env)) { Copy-Item config\.env.example .env }
```

macOS/Linux:

```bash
cd Cyberstorm_NextAuth
npm install --prefix server
npm install --prefix dashboard
cp config/.env.example .env
```

## Run

Option A: two terminals

```powershell
# Terminal 1
node server/index.js

# Terminal 2
npm start --prefix dashboard
```

Option B: one command using npx concurrently

```powershell
npx concurrently -k -p "[{name}]" -n "Backend,Dashboard" -c "cyan.bold,magenta.bold" "node server/index.js" "npm start --prefix dashboard"
```

Note: start.sh uses the same concurrently command on bash systems.

## Demo pages

- Open demo/index.html or demo/ecommerce.html in your browser
- Open sdk/test.html for a quick SDK-only flow

These pages load the SDK from http://localhost:3000/nexauth.js, so keep the
dashboard dev server running.

The SDK defaults to http://localhost:4000 as its API base. If you run
the backend on a different host or port, update API_BASE in sdk/nexauth.js.

## Environment variables

- PORT (default 4000)
- JWT_SECRET (default "nexauth-secret")

The config/.env.example file includes additional placeholders for future
configuration (for example, risk thresholds and tunnel URL), but the
backend currently reads only PORT and JWT_SECRET.

## API endpoints

- POST /auth/register
	- body: { email, password, apiKey }
- POST /auth/login
	- body: { email, hashedPassword, apiKey, timeToFillFormMs }
- GET /auth/verify
	- Authorization: Bearer <jwt>
- GET /stats
	- summary stats and last 20 attempts
- GET /stats/live
	- Server-Sent Events stream for the dashboard

## Tests

With the server running:

```bash
node server/testBackend.js
```

## Troubleshooting

- If npm install fails on better-sqlite3, upgrade to Node 20+ and reinstall.
- If the dashboard shows Demo Mode, the backend is not reachable on :4000.
- If the SDK cannot reach the API, check API_BASE in sdk/nexauth.js.
- If the SDK script 404s, ensure the dashboard is running (it serves /nexauth.js).

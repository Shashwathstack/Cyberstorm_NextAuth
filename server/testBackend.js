/**
 * NexAuth Backend — Integration Test Suite
 * Run with: node testBackend.js
 *
 * Requires the server to be running on http://localhost:4000
 * Start it first with: node server/index.js
 */

const BASE_URL = "http://localhost:4000";

// ─────────────────────────────────────────────────────────────
// Colour helpers for terminal output
// ─────────────────────────────────────────────────────────────
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

let passed = 0;
let failed = 0;

function pass(testName, detail = "") {
  passed++;
  console.log(`  ${GREEN}✅ PASS${RESET} — ${testName}${detail ? `  (${detail})` : ""}`);
}

function fail(testName, detail = "") {
  failed++;
  console.log(`  ${RED}❌ FAIL${RESET} — ${testName}${detail ? `  (${detail})` : ""}`);
}

async function request(method, path, body, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

// ─────────────────────────────────────────────────────────────
// Test runner
// ─────────────────────────────────────────────────────────────
async function runTests() {
  console.log(`\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
  console.log(`${BOLD}${CYAN}   NexAuth Backend — Integration Tests${RESET}`);
  console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

  const TEST_EMAIL = `test_${Date.now()}@nexauth.dev`;
  const TEST_PASSWORD = "sha256hashedfromclient_abc123";
  const TEST_APIKEY = "demo-api-key-001";
  let validToken = null;

  // ───────────────────────────
  // TEST 1 — Register new user
  // ───────────────────────────
  console.log(`${YELLOW}TEST 1 — Register new user${RESET}`);
  try {
    const { status, data } = await request("POST", "/auth/register", {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      apiKey: TEST_APIKEY,
    });

    if (status === 201 && data.success === true && data.message === "User registered") {
      pass("Register new user", `email=${TEST_EMAIL}`);
    } else {
      fail("Register new user", `status=${status}, body=${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail("Register new user", `Error: ${err.message}`);
  }

  // ─────────────────────────────────────
  // TEST 2 — Register same email again
  // ─────────────────────────────────────
  console.log(`\n${YELLOW}TEST 2 — Register duplicate email${RESET}`);
  try {
    const { status, data } = await request("POST", "/auth/register", {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      apiKey: TEST_APIKEY,
    });

    if (status === 409 && data.error === "Email already exists") {
      pass("Duplicate email rejected", `error="${data.error}"`);
    } else {
      fail("Duplicate email rejected", `status=${status}, body=${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail("Duplicate email rejected", `Error: ${err.message}`);
  }

  // ─────────────────────────────────────
  // TEST 3 — Login with correct password
  // ─────────────────────────────────────
  console.log(`\n${YELLOW}TEST 3 — Login with correct password${RESET}`);
  try {
    const { status, data } = await request("POST", "/auth/login", {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      apiKey: TEST_APIKEY,
    });

    if (status === 200 && data.success === true && data.token) {
      validToken = data.token;
      pass("Login successful — JWT issued", `user.email=${data.user?.email}`);
    } else {
      fail("Login successful — JWT issued", `status=${status}, body=${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail("Login successful — JWT issued", `Error: ${err.message}`);
  }

  // ──────────────────────────────────────
  // TEST 4 — Login with wrong password
  // ──────────────────────────────────────
  console.log(`\n${YELLOW}TEST 4 — Login with wrong password${RESET}`);
  try {
    const { status, data } = await request("POST", "/auth/login", {
      email: TEST_EMAIL,
      password: "totallywrongpassword",
      apiKey: TEST_APIKEY,
    });

    if (status === 401 && data.error === "Invalid credentials") {
      pass("Wrong password rejected with generic error");
    } else {
      fail("Wrong password rejected with generic error", `status=${status}, body=${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail("Wrong password rejected with generic error", `Error: ${err.message}`);
  }

  // ──────────────────────────────────────
  // TEST 5 — Verify a valid token
  // ──────────────────────────────────────
  console.log(`\n${YELLOW}TEST 5 — Verify valid JWT token${RESET}`);
  try {
    if (!validToken) throw new Error("No token from TEST 3 — skipping");

    const { status, data } = await request(
      "GET",
      "/auth/verify",
      null,
      { Authorization: `Bearer ${validToken}` }
    );

    if (status === 200 && data.valid === true && data.user) {
      pass("Valid token verified", `user.email=${data.user.email}`);
    } else {
      fail("Valid token verified", `status=${status}, body=${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail("Valid token verified", `Error: ${err.message}`);
  }

  // ──────────────────────────────────────
  // TEST 6 — Verify a fake/invalid token
  // ──────────────────────────────────────
  console.log(`\n${YELLOW}TEST 6 — Verify fake/invalid token${RESET}`);
  try {
    const { status, data } = await request(
      "GET",
      "/auth/verify",
      null,
      { Authorization: "Bearer this.is.a.fake.token" }
    );

    if (status === 401 && data.valid === false && data.reason === "invalid") {
      pass("Fake token rejected", `reason="${data.reason}"`);
    } else {
      fail("Fake token rejected", `status=${status}, body=${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail("Fake token rejected", `Error: ${err.message}`);
  }

  // ──────────────────────────────────────
  // TEST 7 — Get live stats
  // ──────────────────────────────────────
  console.log(`\n${YELLOW}TEST 7 — Get /stats dashboard data${RESET}`);
  try {
    const { status, data } = await request("GET", "/stats");

    const hasRequired =
      typeof data.totalLogins === "number" &&
      typeof data.successfulLogins === "number" &&
      typeof data.failedLogins === "number" &&
      typeof data.threatsBlocked === "number" &&
      typeof data.activeWebsites === "number" &&
      typeof data.successRate === "number" &&
      Array.isArray(data.recentAttempts);

    if (status === 200 && hasRequired) {
      pass(
        "Stats endpoint returns live data",
        `total=${data.totalLogins}, success=${data.successfulLogins}, failed=${data.failedLogins}, rate=${data.successRate}%`
      );
    } else {
      fail("Stats endpoint returns live data", `status=${status}, body=${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail("Stats endpoint returns live data", `Error: ${err.message}`);
  }

  // ─────────────────────────────────────
  // Summary
  // ─────────────────────────────────────
  const total = passed + failed;
  console.log(`\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
  console.log(
    `${BOLD}  Results: ${GREEN}${passed} passed${RESET}${BOLD} / ${RED}${failed} failed${RESET}${BOLD} / ${total} total${RESET}`
  );
  if (failed === 0) {
    console.log(`${BOLD}${GREEN}  🎉 All tests passed! NexAuth backend is fully operational.${RESET}`);
  } else {
    console.log(`${BOLD}${RED}  ⚠️  Some tests failed. Check the server logs above.${RESET}`);
  }
  console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);
}

runTests().catch((err) => {
  console.error(
    `\n${RED}${BOLD}Fatal error — is the server running on port 4000?${RESET}`
  );
  console.error(`  ${err.message}\n`);
  process.exit(1);
});

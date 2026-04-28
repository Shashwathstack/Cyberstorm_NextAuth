const { checkLogin, getStats, __test_setState, __test_resetState } = require('./aiMonitor');

console.log("=========================================");
console.log("🛡️  NexAuth AI Engine Test Suite");
console.log("=========================================\n");

// TEST 1 — Normal login → should score 0-20
console.log(">>> TEST 1: Normal login attempt");
checkLogin({ ip: '192.168.1.1', body: { email: 'user@example.com' }, headers: { 'user-agent': 'Mozilla/5.0', 'accept': '*/*', 'accept-language': 'en-US' } }, true, { timeToFillFormMs: 5000, hour: 10, country: 'US' });
console.log("-----------------------------------------\n");

__test_resetState();

// TEST 2 — 3 wrong passwords → should score 30-40
console.log(">>> TEST 2: 3 wrong passwords");
for(let i=0; i<3; i++) {
    checkLogin({ ip: '10.0.0.1', body: { email: 'target@example.com' }, headers: { 'user-agent': 'Mozilla/5.0', 'accept': '*/*', 'accept-language': 'en-US' } }, false, { timeToFillFormMs: 4000, hour: 14, country: 'US' });
}
console.log("-----------------------------------------\n");

__test_resetState();

// TEST 3 — 100 attempts in 60 seconds → should score 90+
console.log(">>> TEST 3: 100 attempts in 60 seconds");
const fakeAttempts = [];
for(let i=0; i<101; i++) {
    fakeAttempts.push({ timestamp: Date.now(), ip: '10.0.0.2', email: 'spam@example.com', success: false });
}
__test_setState({ recentAttempts: fakeAttempts, failedAttemptsByIp: { '10.0.0.2': 101 } });
checkLogin({ ip: '10.0.0.2', body: { email: 'spam@example.com' }, headers: { 'user-agent': 'Mozilla/5.0', 'accept': '*/*', 'accept-language': 'en-US' } }, false, { timeToFillFormMs: 2000, hour: 14, country: 'US' });
console.log("-----------------------------------------\n");

__test_resetState();

// TEST 4 — Bot user agent → should detect as bot
console.log(">>> TEST 4: Bot user agent");
checkLogin({ ip: '172.16.0.1', body: { email: 'bot@example.com' }, headers: { 'user-agent': 'python-requests/2.25.1' } }, false, { timeToFillFormMs: 100, hour: 12, country: 'RU' });
console.log("-----------------------------------------\n");

__test_resetState();

// TEST 5 — Login from new country → should flag anomaly
console.log(">>> TEST 5: Login from new country (Location Anomaly)");
checkLogin({ ip: '192.168.2.1', body: { email: 'traveler@example.com' }, headers: { 'user-agent': 'Mozilla/5.0', 'accept': '*/*', 'accept-language': 'en-US' } }, true, { 
    timeToFillFormMs: 5000, 
    hour: 10, 
    country: 'Russia',
    userHistory: { usualCountry: 'India', usualLoginHours: [9,10,11,12,13,14,15,16,17,18,19,20,21,22,23] }
});
console.log("-----------------------------------------\n");

__test_resetState();

// TEST 6 — Impossible travel → should flag anomaly
console.log(">>> TEST 6: Impossible travel");
checkLogin({ ip: '192.168.3.1', body: { email: 'fast@example.com' }, headers: { 'user-agent': 'Mozilla/5.0', 'accept': '*/*', 'accept-language': 'en-US' } }, true, { 
    timeToFillFormMs: 5000, 
    hour: 10, 
    country: 'USA',
    userHistory: { 
        usualCountry: 'India', 
        usualLoginHours: [9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],
        lastLoginLocation: { country: 'India', timestamp: Date.now() - (5 * 60 * 1000) } // 5 mins ago
    }
});
console.log("-----------------------------------------\n");

console.log(">>> FINAL ENGINE STATS (After Test 6)");
console.log(getStats());

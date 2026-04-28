const { calculateRiskScore } = require('./riskScore');
const { detectAnomalies } = require('./anomalyDetector');
const { detectBot } = require('./botDetector');

const state = {
    failedAttemptsByIp: {},
    failedAttemptsByEmail: {},
    recentAttempts: [], 
    stats: {
        totalAttempts: 0,
        blockedAttempts: 0,
        currentRiskLevel: 'low'
    }
};

function cleanRecentAttempts() {
    const now = Date.now();
    state.recentAttempts = state.recentAttempts.filter(a => now - a.timestamp < 60000);
}

function checkLogin(req, success, additionalData = {}) {
    state.stats.totalAttempts++;
    cleanRecentAttempts();

    const ip = req.ip || 'unknown';
    const email = req.body?.email || 'unknown';
    const now = Date.now();

    state.recentAttempts.push({ timestamp: now, ip, email, success });

    if (!success) {
        state.failedAttemptsByIp[ip] = (state.failedAttemptsByIp[ip] || 0) + 1;
        state.failedAttemptsByEmail[email] = (state.failedAttemptsByEmail[email] || 0) + 1;
    }

    const recentFailed = state.recentAttempts.filter(a => !a.success);
    const distinctEmailsFromIP = new Set(recentFailed.filter(a => a.ip === ip).map(a => a.email)).size;
    const distinctIpsForEmail = new Set(state.recentAttempts.filter(a => a.email === email).map(a => a.ip)).size;

    const ua = req.headers ? req.headers['user-agent'] : undefined;
    const uaLower = ua ? ua.toLowerCase() : '';

    const loginData = {
        ipFailedAttempts: state.failedAttemptsByIp[ip] || 0,
        recentFailedAttempts: recentFailed.length,
        hour: additionalData.hour !== undefined ? additionalData.hour : new Date().getHours(),
        emailExists: additionalData.emailExists !== undefined ? additionalData.emailExists : true,
        distinctEmailsFromIP: distinctEmailsFromIP,
        hasUserAgent: !!ua,
        userAgentIsBot: uaLower && (uaLower.includes('curl') || uaLower.includes('python') || uaLower.includes('bot') || uaLower.includes('requests') || uaLower.includes('crawler')),
        ipRequestsIn60s: state.recentAttempts.filter(a => a.ip === ip).length,
        emailIpsIn60s: distinctIpsForEmail,
        country: additionalData.country,
        timeToFillFormMs: additionalData.timeToFillFormMs,
        isRegularInterval: additionalData.isRegularInterval || false,
        passwordUsedOnMultipleEmails: additionalData.passwordUsedOnMultipleEmails || false
    };

    const userHistory = additionalData.userHistory || null;

    const risk = calculateRiskScore(loginData);
    const anomaly = detectAnomalies(loginData, userHistory);
    const bot = detectBot(req, loginData);

    let finalScore = risk.score;

    if (finalScore > 0) {
        console.log(`⚠️  RISK SCORE: ${finalScore} — Reason: ${risk.reasons.join(', ')}`);
    }

    if (bot.isBot) {
        console.log(`🚨 BOT DETECTED — Signals: ${bot.signals.join(', ')}`);
        finalScore = Math.max(finalScore, bot.confidence);
    }

    if (anomaly.hasAnomaly) {
        console.log(`🌍 ANOMALY: ${anomaly.anomalies.join(' | ')}`);
        finalScore = Math.max(finalScore, anomaly.severity === 'high' ? 85 : 60);
    }

    let action = 'allow';
    
    if (finalScore > 95) {
        action = 'block_and_alert';
        state.stats.blockedAttempts++;
        state.stats.currentRiskLevel = 'critical';
        console.log(`🚨 EMERGENCY ALERT — Risk score ${finalScore}, possible breach`);
    } else if (finalScore > 80) {
        action = 'block';
        state.stats.blockedAttempts++;
        state.stats.currentRiskLevel = 'high';
        console.log(`🚫 LOGIN BLOCKED — Risk score ${finalScore} exceeded threshold`);
    } else if (finalScore > 50) {
        action = 'flag';
        state.stats.currentRiskLevel = 'medium';
    } else {
        state.stats.currentRiskLevel = 'low';
    }

    return { action, finalScore, stats: state.stats };
}

function getStats() {
    return state.stats;
}

function __test_setState(newState) {
    Object.assign(state, newState);
}

function __test_resetState() {
    state.failedAttemptsByIp = {};
    state.failedAttemptsByEmail = {};
    state.recentAttempts = [];
    state.stats = { totalAttempts: 0, blockedAttempts: 0, currentRiskLevel: 'low' };
}

module.exports = { checkLogin, getStats, __test_setState, __test_resetState };

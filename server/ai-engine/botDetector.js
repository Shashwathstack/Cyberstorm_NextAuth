function detectBot(req, loginData) {
    let isBot = false;
    let confidence = 0;
    let signals = [];

    if (loginData.timeToFillFormMs !== undefined && loginData.timeToFillFormMs < 1000) {
        isBot = true;
        confidence += 40;
        signals.push("Too fast (under 1s)");
    }

    const ua = req.headers && req.headers['user-agent'] ? req.headers['user-agent'].toLowerCase() : '';
    if (!ua) {
        isBot = true;
        confidence += 50;
        signals.push("Missing user agent");
    } else if (ua.includes("curl") || ua.includes("python") || ua.includes("requests") || ua.includes("bot") || ua.includes("crawler")) {
        isBot = true;
        confidence += 80;
        signals.push("Bot/script user agent");
    }

    if (loginData.isRegularInterval) {
        isBot = true;
        confidence += 60;
        signals.push("Perfectly regular request intervals");
    }

    if (req.headers && (!req.headers['accept'] || !req.headers['accept-language'])) {
        isBot = true;
        confidence += 30;
        signals.push("Missing common browser headers");
    }

    if (loginData.passwordUsedOnMultipleEmails) {
        isBot = true;
        confidence += 70;
        signals.push("Credential stuffing pattern");
    }

    if (confidence > 100) confidence = 100;
    if (confidence > 0) isBot = true;

    return { isBot, confidence, signals };
}

module.exports = { detectBot };

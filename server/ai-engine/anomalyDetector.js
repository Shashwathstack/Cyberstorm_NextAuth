function detectAnomalies(loginData, userHistory) {
    let hasAnomaly = false;
    let anomalies = [];
    let severity = "low";

    if (loginData.ipRequestsIn60s > 20) {
        hasAnomaly = true;
        anomalies.push("Frequency Anomaly: >20 requests in 60s");
        severity = "high";
    }

    if (loginData.emailIpsIn60s > 3) {
        hasAnomaly = true;
        anomalies.push("Frequency Anomaly: Email tried from >3 IPs in 60s");
        severity = "high";
    }

    if (userHistory) {
        if (userHistory.usualCountry && loginData.country && userHistory.usualCountry !== loginData.country) {
            hasAnomaly = true;
            anomalies.push(`Location Anomaly — ${userHistory.usualCountry} → ${loginData.country}`);
            severity = severity === "high" ? "high" : "medium";
        }

        if (userHistory.usualLoginHours && loginData.hour !== undefined) {
            if (!userHistory.usualLoginHours.includes(loginData.hour)) {
                hasAnomaly = true;
                anomalies.push(`Time Anomaly: User logged in at unusual hour (${loginData.hour}:00)`);
                severity = severity === "high" ? "high" : "medium";
            }
        }

        if (userHistory.lastLoginLocation && loginData.country && userHistory.lastLoginLocation.country !== loginData.country) {
            let timeDiff = (Date.now() - userHistory.lastLoginLocation.timestamp) / 1000 / 60; // minutes
            if (timeDiff < 60) {
                hasAnomaly = true;
                anomalies.push(`Impossible Travel: ${userHistory.lastLoginLocation.country} to ${loginData.country} in under an hour`);
                severity = "high";
            }
        }
    }

    return { hasAnomaly, anomalies, severity };
}

module.exports = { detectAnomalies };

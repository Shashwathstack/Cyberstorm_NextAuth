function calculateRiskScore(loginData) {
  let score = 0;
  let reasons = [];

  if (loginData.ipFailedAttempts === 3 || loginData.ipFailedAttempts === 4) {
    score += 10;
    reasons.push("3rd failed attempt from same IP");
  }
  if (loginData.ipFailedAttempts >= 5) {
    score += 20;
    reasons.push("5th failed attempt or more from same IP");
  }
  
  if (loginData.recentFailedAttempts > 100) {
    score += 80;
    reasons.push("More than 100 failed attempts in 60 seconds");
  } else if (loginData.recentFailedAttempts > 50) {
    score += 60;
    reasons.push("More than 50 failed attempts in 60 seconds");
  } else if (loginData.recentFailedAttempts > 10) {
    score += 40;
    reasons.push("More than 10 failed attempts in 60 seconds");
  }

  if (loginData.hour >= 1 && loginData.hour <= 5) {
    score += 15;
    reasons.push("Login time is between 1am and 5am");
  }

  if (loginData.emailExists === false) {
    score += 10;
    reasons.push("Email does not exist in system");
  }

  if (loginData.distinctEmailsFromIP > 5) {
    score += 20;
    reasons.push("Same IP tried more than 5 different emails");
  }

  if (!loginData.hasUserAgent) {
    score += 25;
    reasons.push("Request has no user agent header");
  }

  if (loginData.userAgentIsBot) {
    score += 30;
    reasons.push("User agent looks like a bot or script");
  }

  if (score > 100) score = 100;

  return { score, reasons };
}

module.exports = { calculateRiskScore };

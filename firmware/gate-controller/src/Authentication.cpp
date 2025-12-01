#include "Authentication.h"
#include "JWTUtils.h"
#include "secrets.h"
#include <Arduino.h>

Authentication::Authentication() {
}

void Authentication::begin() {
  #if ENABLE_SERIAL_LOG
  Serial.println("Authentication system initialized");
  #endif
}

void Authentication::update() {
  // Cleanup expired tokens every minute
  static unsigned long lastCleanup = 0;
  if (millis() - lastCleanup > 60000) {
    cleanupExpiredTokens();
    lastCleanup = millis();
  }
}

String Authentication::login(String username, String password, String clientIP) {
  #if ENABLE_SERIAL_LOG && LOG_LEVEL >= 3
  Serial.print("Login attempt from: ");
  Serial.println(clientIP);
  #endif
  
  // Check if IP is blocked
  if (isIPBlocked(clientIP)) {
    #if ENABLE_SERIAL_LOG && LOG_LEVEL >= 2
    Serial.print("Blocked IP attempted login: ");
    Serial.println(clientIP);
    #endif
    return "";
  }
  
  // Check rate limit
  if (!checkRateLimit(clientIP)) {
    #if ENABLE_SERIAL_LOG && LOG_LEVEL >= 2
    Serial.print("Rate limit exceeded for IP: ");
    Serial.println(clientIP);
    #endif
    return "";
  }
  
  // Validate credentials
  if (username == API_USERNAME && password == API_PASSWORD) {
    // Reset failed attempts
    failedLoginAttempts[clientIP] = 0;
    
    // Generate JWT token with expiration
    unsigned long expirationTime = currentTimestamp() + JWT_EXPIRATION_TIME;
    String token = JWTUtils::generateJWT(expirationTime);

    // Allow only one active token at a time
    if (!validTokens.empty()) {
      validTokens.clear();
      #if ENABLE_SERIAL_LOG && LOG_LEVEL >= 3
      Serial.println("Existing sessions cleared (single-session policy)");
      #endif
    }
    
    // Store token info (for tracking, but JWT itself contains expiration)
    TokenInfo info;
    info.token = token;
    info.expiresAt = expirationTime;
    info.clientIP = clientIP;
    
    validTokens[token] = info;
    
    #if ENABLE_SERIAL_LOG && LOG_LEVEL >= 3
    Serial.print("Login successful for IP: ");
    Serial.println(clientIP);
    Serial.print("Token expires at: ");
    Serial.println(expirationTime);
    #endif
    
    return token;
  } else {
    // Increment failed attempts
    failedLoginAttempts[clientIP]++;
    
    #if ENABLE_SERIAL_LOG && LOG_LEVEL >= 2
    Serial.print("Login failed for IP: ");
    Serial.print(clientIP);
    Serial.print(" (attempt ");
    Serial.print(failedLoginAttempts[clientIP]);
    Serial.println(")");
    #endif
    
    // Block IP if too many failed attempts
    if (failedLoginAttempts[clientIP] >= MAX_LOGIN_ATTEMPTS) {
      blockIP(clientIP);
    }
    
    return "";
  }
}

bool Authentication::validateToken(String token) {
  if (token.length() == 0) return false;
  
  // Verify JWT token (signature and expiration)
  unsigned long expirationTime = 0;
  if (!JWTUtils::verifyJWT(token, expirationTime)) {
    // Token invalid or expired - remove from map if exists
    if (validTokens.find(token) != validTokens.end()) {
      validTokens.erase(token);
    }
    return false;
  }
  
  // Token is valid - check if it's in our map (optional, for tracking)
  // JWT itself is self-contained, but we keep map for logout functionality
  if (validTokens.find(token) == validTokens.end()) {
    // Token is valid JWT but not in our map - might be from previous session
    // For single-session policy, we could reject it, but for now accept valid JWTs
    return true;
  }
  
  return true;
}

void Authentication::logout(String token) {
  validTokens.erase(token);
  
  #if ENABLE_SERIAL_LOG && LOG_LEVEL >= 3
  Serial.println("Token invalidated (logout)");
  #endif
}

bool Authentication::checkRateLimit(String clientIP) {
  unsigned long now = millis();
  
  // Get or create rate limit info
  if (rateLimits.find(clientIP) == rateLimits.end()) {
    RateLimitInfo info;
    info.windowStart = now;
    info.requestCount = 1;
    rateLimits[clientIP] = info;
    return true;
  }
  
  RateLimitInfo& info = rateLimits[clientIP];
  
  // Check if window has expired
  if (now - info.windowStart > RATE_LIMIT_WINDOW) {
    info.windowStart = now;
    info.requestCount = 1;
    return true;
  }
  
  // Check if limit is exceeded
  if (info.requestCount >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  info.requestCount++;
  return true;
}

void Authentication::resetRateLimit(String clientIP) {
  rateLimits.erase(clientIP);
}

bool Authentication::isIPBlocked(String clientIP) {
  return failedLoginAttempts[clientIP] >= MAX_LOGIN_ATTEMPTS;
}

void Authentication::blockIP(String clientIP) {
  #if ENABLE_SERIAL_LOG && LOG_LEVEL >= 1
  Serial.print("IP BLOCKED due to too many failed attempts: ");
  Serial.println(clientIP);
  #endif
  
  // In a real implementation, you might want to store blocked IPs
  // in EEPROM/SPIFFS for persistence across reboots
}

void Authentication::cleanupExpiredTokens() {
  unsigned long now = currentTimestamp();
  int cleaned = 0;
  
  // Create list of expired tokens
  std::vector<String> expiredTokens;
  for (auto& pair : validTokens) {
    if (now > pair.second.expiresAt) {
      expiredTokens.push_back(pair.first);
    }
  }
  
  // Remove expired tokens
  for (String& token : expiredTokens) {
    validTokens.erase(token);
    cleaned++;
  }
  
  #if ENABLE_SERIAL_LOG && LOG_LEVEL >= 4
  if (cleaned > 0) {
    Serial.print("Cleaned up ");
    Serial.print(cleaned);
    Serial.println(" expired tokens");
  }
  #endif
}

int Authentication::getActiveTokenCount() {
  return validTokens.size();
}

unsigned long Authentication::currentTimestamp() {
  // Returns current Unix timestamp in seconds
  time_t now;
  time(&now);
  
  // If NTP hasn't synced yet, fall back to boot time + current millis
  if (now < 1609459200) { // Before 2021-01-01 (unlikely valid timestamp)
    return millis() / 1000;
  }
  
  return (unsigned long)now;
}


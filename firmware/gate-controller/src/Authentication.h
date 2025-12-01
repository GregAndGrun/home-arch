#ifndef AUTHENTICATION_H
#define AUTHENTICATION_H

#include <Arduino.h>
#include <map>
#include <vector>
#include "config.h"

struct TokenInfo {
  String token;
  unsigned long expiresAt;
  String clientIP;
};

struct RateLimitInfo {
  unsigned long windowStart;
  int requestCount;
};

class Authentication {
private:
  std::map<String, TokenInfo> validTokens;
  std::map<String, RateLimitInfo> rateLimits;
  std::map<String, int> failedLoginAttempts;
  
  unsigned long currentTimestamp();

public:
  Authentication();
  
  void begin();
  void update();
  
  // Authentication methods
  String login(String username, String password, String clientIP);
  bool validateToken(String token);
  void logout(String token);
  
  // Rate limiting
  bool checkRateLimit(String clientIP);
  void resetRateLimit(String clientIP);
  
  // Security
  bool isIPBlocked(String clientIP);
  void blockIP(String clientIP);
  
  // Token management
  void cleanupExpiredTokens();
  int getActiveTokenCount();
};

#endif // AUTHENTICATION_H


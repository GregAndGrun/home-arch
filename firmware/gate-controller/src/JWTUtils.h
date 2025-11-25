#ifndef JWT_UTILS_H
#define JWT_UTILS_H

#include <Arduino.h>
#include <mbedtls/md.h>
#include "config.h"
#include "secrets.h"

class JWTUtils {
public:
  // Generate a JWT token with expiration
  static String generateJWT(unsigned long expirationTime);
  
  // Verify and decode JWT token
  static bool verifyJWT(String token, unsigned long& expirationTime);
  
  // Base64 URL-safe encoding
  static String base64UrlEncode(String data);
  
  // Base64 URL-safe decoding
  static String base64UrlDecode(String data);
  
  // HMAC-SHA256 signature
  static String hmacSHA256(String message, String secret);
  
private:
  // Helper: Convert byte array to hex string
  static String bytesToHex(uint8_t* bytes, size_t length);
  
  // Helper: Convert hex string to byte array
  static void hexToBytes(String hex, uint8_t* bytes, size_t maxLength);
};

#endif // JWT_UTILS_H


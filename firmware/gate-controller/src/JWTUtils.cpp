#include "JWTUtils.h"
#include <string.h>
#include <time.h>

// Base64 URL-safe character set
const char base64url_chars[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

String JWTUtils::base64UrlEncode(String data) {
  // Base64url encoding (without padding for JWT)
  String encoded = "";
  int val = 0;
  int valb = -6;
  
  for (int i = 0; i < data.length(); i++) {
    unsigned char c = data.charAt(i);
    val = (val << 8) + c;
    valb += 8;
    while (valb >= 0) {
      encoded += base64url_chars[(val >> valb) & 0x3F];
      valb -= 6;
    }
  }
  
  if (valb > -6) {
    encoded += base64url_chars[((val << 8) >> (valb + 8)) & 0x3F];
  }
  
  return encoded;
}

String JWTUtils::base64UrlDecode(String data) {
  // Simple base64url decoding
  String decoded = "";
  int val = 0;
  int valb = -8;
  
  for (char c : data) {
    int index = -1;
    if (c >= 'A' && c <= 'Z') index = c - 'A';
    else if (c >= 'a' && c <= 'z') index = c - 'a' + 26;
    else if (c >= '0' && c <= '9') index = c - '0' + 52;
    else if (c == '-') index = 62;
    else if (c == '_') index = 63;
    else continue; // Skip invalid characters
    
    val = (val << 6) + index;
    valb += 6;
    if (valb >= 0) {
      decoded += (char)((val >> valb) & 0xFF);
      valb -= 8;
    }
  }
  
  return decoded;
}

String JWTUtils::hmacSHA256(String message, String secret) {
  mbedtls_md_context_t ctx;
  const mbedtls_md_info_t *md_info;
  unsigned char hmac[32];
  
  md_info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
  if (md_info == NULL) {
    return "";
  }
  
  mbedtls_md_init(&ctx);
  if (mbedtls_md_setup(&ctx, md_info, 1) != 0) { // 1 = HMAC mode
    mbedtls_md_free(&ctx);
    return "";
  }
  
  mbedtls_md_hmac_starts(&ctx, (const unsigned char*)secret.c_str(), secret.length());
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)message.c_str(), message.length());
  mbedtls_md_hmac_finish(&ctx, hmac);
  mbedtls_md_free(&ctx);
  
  // Convert to hex string
  return bytesToHex(hmac, 32);
}

String JWTUtils::bytesToHex(uint8_t* bytes, size_t length) {
  String hex = "";
  for (size_t i = 0; i < length; i++) {
    if (bytes[i] < 16) hex += "0";
    hex += String(bytes[i], HEX);
  }
  return hex;
}

void JWTUtils::hexToBytes(String hex, uint8_t* bytes, size_t maxLength) {
  size_t len = hex.length() / 2;
  if (len > maxLength) len = maxLength;
  
  for (size_t i = 0; i < len; i++) {
    char c1 = hex.charAt(i * 2);
    char c2 = hex.charAt(i * 2 + 1);
    int val1 = (c1 >= '0' && c1 <= '9') ? c1 - '0' : (c1 - 'a' + 10);
    int val2 = (c2 >= '0' && c2 <= '9') ? c2 - '0' : (c2 - 'a' + 10);
    bytes[i] = (val1 << 4) + val2;
  }
}

String JWTUtils::generateJWT(unsigned long expirationTime) {
  // JWT Header: {"alg":"HS256","typ":"JWT"}
  String header = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
  String encodedHeader = base64UrlEncode(header);
  
  // JWT Payload: {"exp":expirationTime,"iat":currentTime}
  // Use Unix timestamp (NTP synced)
  time_t now;
  time(&now);
  unsigned long currentTime = (now < 1609459200) ? (millis() / 1000) : (unsigned long)now; // Fallback to boot time if NTP not synced
  String payload = "{\"exp\":" + String(expirationTime) + ",\"iat\":" + String(currentTime) + "}";
  String encodedPayload = base64UrlEncode(payload);
  
  // Create signature: HMAC-SHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
  String message = encodedHeader + "." + encodedPayload;
  
  // Get HMAC-SHA256 directly as bytes
  mbedtls_md_context_t ctx;
  const mbedtls_md_info_t *md_info;
  unsigned char hmac[32];
  
  md_info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
  if (md_info == NULL) {
    return "";
  }
  
  mbedtls_md_init(&ctx);
  if (mbedtls_md_setup(&ctx, md_info, 1) != 0) {
    mbedtls_md_free(&ctx);
    return "";
  }
  
  mbedtls_md_hmac_starts(&ctx, (const unsigned char*)JWT_SECRET, strlen(JWT_SECRET));
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)message.c_str(), message.length());
  mbedtls_md_hmac_finish(&ctx, hmac);
  mbedtls_md_free(&ctx);
  
  // Convert HMAC bytes directly to base64url
  String sigString = "";
  for (int i = 0; i < 32; i++) {
    sigString += (char)hmac[i];
  }
  String encodedSignature = base64UrlEncode(sigString);
  
  // JWT = header.payload.signature
  return encodedHeader + "." + encodedPayload + "." + encodedSignature;
}

bool JWTUtils::verifyJWT(String token, unsigned long& expirationTime) {
  // Split token into parts
  int firstDot = token.indexOf('.');
  int secondDot = token.indexOf('.', firstDot + 1);
  
  if (firstDot == -1 || secondDot == -1) {
    return false; // Invalid format
  }
  
  String encodedHeader = token.substring(0, firstDot);
  String encodedPayload = token.substring(firstDot + 1, secondDot);
  String encodedSignature = token.substring(secondDot + 1);
  
  // Verify signature
  String message = encodedHeader + "." + encodedPayload;
  
  // Calculate expected HMAC-SHA256
  mbedtls_md_context_t ctx;
  const mbedtls_md_info_t *md_info;
  unsigned char hmac[32];
  
  md_info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
  if (md_info == NULL) {
    return false;
  }
  
  mbedtls_md_init(&ctx);
  if (mbedtls_md_setup(&ctx, md_info, 1) != 0) {
    mbedtls_md_free(&ctx);
    return false;
  }
  
  mbedtls_md_hmac_starts(&ctx, (const unsigned char*)JWT_SECRET, strlen(JWT_SECRET));
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)message.c_str(), message.length());
  mbedtls_md_hmac_finish(&ctx, hmac);
  mbedtls_md_free(&ctx);
  
  // Convert HMAC bytes to base64url
  String sigString = "";
  for (int i = 0; i < 32; i++) {
    sigString += (char)hmac[i];
  }
  String expectedEncodedSignature = base64UrlEncode(sigString);
  
  if (expectedEncodedSignature != encodedSignature) {
    return false; // Signature mismatch
  }
  
  // Decode payload
  String payload = base64UrlDecode(encodedPayload);
  
  // Extract expiration time from JSON payload
  // Simple JSON parsing for {"exp":1234567890,"iat":1234567890}
  int expIndex = payload.indexOf("\"exp\":");
  if (expIndex == -1) {
    return false; // No expiration claim
  }
  
  int expStart = expIndex + 6; // After "exp":
  int expEnd = payload.indexOf(',', expStart);
  if (expEnd == -1) {
    expEnd = payload.indexOf('}', expStart);
  }
  if (expEnd == -1) {
    return false;
  }
  
  String expStr = payload.substring(expStart, expEnd);
  expStr.trim(); // Remove whitespace
  expirationTime = expStr.toInt();
  
  // Check if token is expired
  // Use Unix timestamp (NTP synced)
  time_t now;
  time(&now);
  unsigned long currentTime = (now < 1609459200) ? (millis() / 1000) : (unsigned long)now; // Fallback to boot time if NTP not synced
  
  if (currentTime >= expirationTime) {
    return false; // Token expired
  }
  
  return true;
}


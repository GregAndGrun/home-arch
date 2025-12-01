#include "WebServer.h"
#include <ArduinoJson.h>
#include "config.h"

void setupWebServer(AsyncWebServer& server, 
                   #if ENABLE_GATE1
                   GateController& gate1,
                   #endif
                   #if ENABLE_GATE2
                   GateController& gate2,
                   #endif
                   Authentication& auth) {
  
  // CORS headers for all responses
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  // Handle CORS preflight OPTIONS requests globally
  server.onNotFound([](AsyncWebServerRequest *request) {
    if (request->method() == HTTP_OPTIONS) {
      request->send(200);
    } else {
      request->send(404, "application/json", "{\"error\":\"Not found\"}");
    }
  });
  
  // OPTIONS handler for API routes (CORS preflight)
  server.on("/api/auth/login", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  server.on("/api/auth/logout", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  server.on("/api/gates/status", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  #if ENABLE_GATE1
  server.on("/api/gates/entrance/trigger", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  server.on("/api/gates/entrance/open", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  server.on("/api/gates/entrance/close", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  #endif
  #if ENABLE_GATE2
  server.on("/api/gates/garage/trigger", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  server.on("/api/gates/garage/open", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  server.on("/api/gates/garage/close", HTTP_OPTIONS, [](AsyncWebServerRequest *request) {
    request->send(200);
  });
  #endif
  
  // Root endpoint - API info
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    StaticJsonDocument<200> doc;
    doc["name"] = "Smart Gate Controller API";
    doc["version"] = "1.0.0";
    doc["status"] = "online";
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  
  // Health check endpoint
  server.on("/api/health", HTTP_GET, [](AsyncWebServerRequest *request) {
    StaticJsonDocument<300> doc;
    doc["status"] = "healthy";
    doc["uptime"] = millis() / 1000;
    doc["freeHeap"] = ESP.getFreeHeap();
    doc["wifiRSSI"] = WiFi.RSSI();
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  
  // Login endpoint
  server.on("/api/auth/login", HTTP_POST, 
    [&auth](AsyncWebServerRequest *request) {}, 
    NULL,
    [&auth](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, (const char*)data);
    
    if (error) {
      request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
      return;
    }
    
    String username = doc["username"] | "";
    String password = doc["password"] | "";
    String clientIP = getClientIP(request);
    
    String token = auth.login(username, password, clientIP);
    
    if (token.length() > 0) {
      StaticJsonDocument<200> response;
      response["success"] = true;
      response["token"] = token;
      response["expiresIn"] = JWT_EXPIRATION_TIME;
      
      String jsonResponse;
      serializeJson(response, jsonResponse);
      request->send(200, "application/json", jsonResponse);
    } else {
      request->send(401, "application/json", "{\"error\":\"Invalid credentials\"}");
    }
  });
  
  // Logout endpoint
  server.on("/api/auth/logout", HTTP_POST, [&auth](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    
    String token = extractToken(request);
    auth.logout(token);
    
    request->send(200, "application/json", "{\"success\":true}");
  });
  
  // Gate status endpoint
  server.on("/api/gates/status", HTTP_GET, [&auth
    #if ENABLE_GATE1
    , &gate1
    #endif
    #if ENABLE_GATE2
    , &gate2
    #endif
    ](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    
    StaticJsonDocument<400> doc;
    
    #if ENABLE_GATE1
    JsonObject g1 = doc.createNestedObject("entrance");
    g1["state"] = gate1.getStateString();
    g1["hasSensor"] = gate1.hasSensor();
    g1["lastAction"] = gate1.getLastActionTime();
    #endif
    
    #if ENABLE_GATE2
    JsonObject g2 = doc.createNestedObject("garage");
    g2["state"] = gate2.getStateString();
    g2["hasSensor"] = gate2.hasSensor();
    g2["lastAction"] = gate2.getLastActionTime();
    #endif
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  
  // Trigger gate 1 (entrance)
  #if ENABLE_GATE1
  server.on("/api/gates/entrance/trigger", HTTP_POST, [&auth, &gate1](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    
    gate1.trigger();
    
    StaticJsonDocument<200> doc;
    doc["success"] = true;
    doc["gate"] = "entrance";
    doc["action"] = "triggered";
    doc["state"] = gate1.getStateString();
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  #endif
  
  // Trigger gate 2 (garage)
  #if ENABLE_GATE2
  server.on("/api/gates/garage/trigger", HTTP_POST, [&auth, &gate2](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    
    gate2.trigger();
    
    StaticJsonDocument<200> doc;
    doc["success"] = true;
    doc["gate"] = "garage";
    doc["action"] = "triggered";
    doc["state"] = gate2.getStateString();
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  #endif
  
  // Open gate 1
  #if ENABLE_GATE1
  server.on("/api/gates/entrance/open", HTTP_POST, [&auth, &gate1](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    
    gate1.open();
    request->send(200, "application/json", "{\"success\":true,\"action\":\"open\"}");
  });
  #endif
  
  // Open gate 2
  #if ENABLE_GATE2
  server.on("/api/gates/garage/open", HTTP_POST, [&auth, &gate2](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    
    gate2.open();
    request->send(200, "application/json", "{\"success\":true,\"action\":\"open\"}");
  });
  #endif
  
  // Close gate 1
  #if ENABLE_GATE1
  server.on("/api/gates/entrance/close", HTTP_POST, [&auth, &gate1](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    
    gate1.close();
    request->send(200, "application/json", "{\"success\":true,\"action\":\"close\"}");
  });
  #endif
  
  // Close gate 2
  #if ENABLE_GATE2
  server.on("/api/gates/garage/close", HTTP_POST, [&auth, &gate2](AsyncWebServerRequest *request) {
    if (!authorizeRequest(request, auth)) {
      request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
      return;
    }
    
    gate2.close();
    request->send(200, "application/json", "{\"success\":true,\"action\":\"close\"}");
  });
  #endif
  
  // 404 handler
  server.onNotFound([](AsyncWebServerRequest *request) {
    request->send(404, "application/json", "{\"error\":\"Endpoint not found\"}");
  });
}

String getClientIP(AsyncWebServerRequest *request) {
  if (request->hasHeader("X-Forwarded-For")) {
    return request->header("X-Forwarded-For");
  }
  return request->client()->remoteIP().toString();
}

String extractToken(AsyncWebServerRequest *request) {
  if (request->hasHeader("Authorization")) {
    String auth = request->header("Authorization");
    if (auth.startsWith("Bearer ")) {
      return auth.substring(7);
    }
  }
  return "";
}

bool authorizeRequest(AsyncWebServerRequest *request, Authentication& auth) {
  String clientIP = getClientIP(request);
  
  // Check rate limit
  if (!auth.checkRateLimit(clientIP)) {
    return false;
  }
  
  // Extract and validate token
  String token = extractToken(request);
  return auth.validateToken(token);
}


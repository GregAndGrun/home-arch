#ifndef WEBSERVER_H
#define WEBSERVER_H

// HTTP method constants (must be defined before ESPAsyncWebServer.h)
#ifndef HTTP_GET
  #define HTTP_GET     0b00000001
  #define HTTP_POST    0b00000010
  #define HTTP_DELETE  0b00000100
  #define HTTP_PUT     0b00001000
  #define HTTP_PATCH   0b00010000
  #define HTTP_HEAD    0b00100000
  #define HTTP_OPTIONS 0b01000000
  #define HTTP_ANY     0b01111111
#endif

#include "config.h"
#include <ESPAsyncWebServer.h>
#include "GateController.h"
#include "Authentication.h"

// Setup web server with all routes
void setupWebServer(AsyncWebServer& server, 
                   #if ENABLE_GATE1
                   GateController& gate1,
                   #endif
                   #if ENABLE_GATE2
                   GateController& gate2,
                   #endif
                   Authentication& auth);

// Helper functions
String getClientIP(AsyncWebServerRequest *request);
String extractToken(AsyncWebServerRequest *request);
bool authorizeRequest(AsyncWebServerRequest *request, Authentication& auth);

#endif // WEBSERVER_H


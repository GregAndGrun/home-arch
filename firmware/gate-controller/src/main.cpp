#include <Arduino.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include <ArduinoOTA.h>
#include "config.h"
#include "secrets.h"
#include "GateController.h"
#include "WebServer.h"
#include "Authentication.h"
#include <esp_task_wdt.h>
#include <time.h>

// Global objects
AsyncWebServer server(HTTP_PORT);
GateController gate1(GATE1_RELAY_PIN, GATE1_SENSOR_PIN, "entrance");
GateController gate2(GATE2_RELAY_PIN, GATE2_SENSOR_PIN, "garage");
Authentication auth;

// Function declarations
void setupWiFi();
void setupMDNS();
void setupNTP();
void setupOTA();
void printSystemInfo();

void setup() {
  // CRITICAL: Set relay pins to SAFE state FIRST (before anything else)
  // This prevents relay from being active during boot/reset
  pinMode(GATE1_RELAY_PIN, OUTPUT);
  pinMode(GATE2_RELAY_PIN, OUTPUT);
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(GATE1_RELAY_PIN, HIGH); // OFF for active-low
    digitalWrite(GATE2_RELAY_PIN, HIGH);  // OFF for active-low
  } else {
    digitalWrite(GATE1_RELAY_PIN, LOW);   // OFF for active-high
    digitalWrite(GATE2_RELAY_PIN, LOW);  // OFF for active-high
  }
  
  // Initialize serial communication
  #if ENABLE_SERIAL_LOG
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=== Smart Gate Controller ===");
  Serial.println("Version: 1.0.0");
  Serial.println("============================\n");
  #endif

  // Initialize status LED
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);

  // Initialize gate controllers (will set pins again, but safe state is already set)
  gate1.begin();
  gate2.begin();

  // Initialize watchdog timer to prevent system hangs
  esp_task_wdt_init(WATCHDOG_TIMEOUT / 1000, true); // Convert ms to seconds
  esp_task_wdt_add(NULL); // Add current task to watchdog

  // Initialize authentication system
  auth.begin();

  // Connect to WiFi
  setupWiFi();

  // Setup NTP time synchronization
  setupNTP();

  // Setup mDNS
  if (ENABLE_MDNS) {
    setupMDNS();
  }

  // Initialize web server
  setupWebServer(server, gate1, gate2, auth);

  // Start server
  server.begin();
  
  // Setup OTA updates
  setupOTA();
  
  #if ENABLE_SERIAL_LOG
  Serial.println("HTTP server started on port " + String(HTTP_PORT));
  printSystemInfo();
  #endif

  // Blink LED to indicate successful startup
  for (int i = 0; i < 3; i++) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(200);
    digitalWrite(STATUS_LED_PIN, LOW);
    delay(200);
  }
}

void loop() {
  // Reset watchdog timer
  esp_task_wdt_reset();
  
  // Handle OTA updates
  ArduinoOTA.handle();
  
  // Update gate controllers (check sensors, auto-close, etc.)
  gate1.update();
  gate2.update();

  // Update authentication (cleanup expired tokens, rate limiting)
  auth.update();

  // Keep WiFi alive
  static unsigned long lastWiFiCheck = 0;
  if (millis() - lastWiFiCheck > 5000) { // Check WiFi every 5 seconds
    if (WiFi.status() != WL_CONNECTED) {
      #if ENABLE_SERIAL_LOG
      Serial.println("WiFi disconnected! Ensuring relays are OFF before reconnecting...");
      #endif
      
      // CRITICAL: Ensure relays are OFF before reconnecting WiFi
      // This prevents accidental gate activation during WiFi issues
      if (RELAY_ACTIVE_LOW) {
        digitalWrite(GATE1_RELAY_PIN, HIGH);
        digitalWrite(GATE2_RELAY_PIN, HIGH);
      } else {
        digitalWrite(GATE1_RELAY_PIN, LOW);
        digitalWrite(GATE2_RELAY_PIN, LOW);
      }
      
      setupWiFi();
    }
    lastWiFiCheck = millis();
  }

  // Heartbeat LED
  static unsigned long lastBlink = 0;
  if (millis() - lastBlink > 2000) {
    digitalWrite(STATUS_LED_PIN, !digitalRead(STATUS_LED_PIN));
    lastBlink = millis();
  }

  delay(10); // Small delay to prevent watchdog issues
}

void setupWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && 
         millis() - startAttempt < WIFI_CONNECT_TIMEOUT) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\nWiFi connection failed!");
    Serial.println("Ensuring relays are OFF before restart...");
    
    // CRITICAL: Turn off relays before restart
    if (RELAY_ACTIVE_LOW) {
      digitalWrite(GATE1_RELAY_PIN, HIGH);
      digitalWrite(GATE2_RELAY_PIN, HIGH);
    } else {
      digitalWrite(GATE1_RELAY_PIN, LOW);
      digitalWrite(GATE2_RELAY_PIN, LOW);
    }
    delay(100); // Give time for relays to deactivate
    
    Serial.println("Restarting in 5 seconds...");
    delay(5000);
    ESP.restart();
  }
}

void setupNTP() {
  // Configure NTP
  configTime(0, 0, "pool.ntp.org", "time.nist.gov"); // UTC timezone, no DST offset
  
  #if ENABLE_SERIAL_LOG && LOG_LEVEL >= 3
  Serial.print("Waiting for NTP time sync");
  #endif
  
  // Wait for time to be set (up to 10 seconds)
  time_t now = 0;
  struct tm timeinfo = { 0 };
  int attempts = 0;
  while (timeinfo.tm_year < (2024 - 1900) && attempts < 20) {
    delay(500);
    time(&now);
    localtime_r(&now, &timeinfo);
    attempts++;
    #if ENABLE_SERIAL_LOG && LOG_LEVEL >= 3
    Serial.print(".");
    #endif
  }
  
  #if ENABLE_SERIAL_LOG
  Serial.println();
  if (timeinfo.tm_year >= (2024 - 1900)) {
    Serial.print("NTP time synchronized: ");
    char timeStr[64];
    strftime(timeStr, sizeof(timeStr), "%Y-%m-%d %H:%M:%S", &timeinfo);
    Serial.println(timeStr);
    Serial.print("Unix timestamp: ");
    Serial.println(now);
  } else {
    Serial.println("WARNING: NTP time sync failed, using boot time");
  }
  #endif
}

void setupMDNS() {
  if (MDNS.begin(MDNS_HOSTNAME)) {
    Serial.print("mDNS responder started: ");
    Serial.print(MDNS_HOSTNAME);
    Serial.println(".local");
    
    // Add service to mDNS-SD
    MDNS.addService("http", "tcp", HTTP_PORT);
    MDNS.addService("gate-controller", "tcp", HTTP_PORT);
  } else {
    Serial.println("Error setting up mDNS responder!");
  }
}

void setupOTA() {
  // Set OTA hostname
  ArduinoOTA.setHostname(MDNS_HOSTNAME);
  
  // Set OTA password
  ArduinoOTA.setPassword(OTA_PASSWORD);
  
  // OTA callbacks
  ArduinoOTA.onStart([]() {
    String type;
    if (ArduinoOTA.getCommand() == U_FLASH) {
      type = "sketch";
    } else {
      type = "filesystem";
    }
    
    // CRITICAL: Turn off relays before OTA update
    if (RELAY_ACTIVE_LOW) {
      digitalWrite(GATE1_RELAY_PIN, HIGH);
      digitalWrite(GATE2_RELAY_PIN, HIGH);
    } else {
      digitalWrite(GATE1_RELAY_PIN, LOW);
      digitalWrite(GATE2_RELAY_PIN, LOW);
    }
    
    #if ENABLE_SERIAL_LOG
    Serial.println("OTA Start: " + type);
    #endif
  });
  
  ArduinoOTA.onEnd([]() {
    #if ENABLE_SERIAL_LOG
    Serial.println("\nOTA End");
    #endif
  });
  
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    #if ENABLE_SERIAL_LOG
    Serial.printf("OTA Progress: %u%%\r", (progress / (total / 100)));
    #endif
  });
  
  ArduinoOTA.onError([](ota_error_t error) {
    #if ENABLE_SERIAL_LOG
    Serial.printf("OTA Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
    else if (error == OTA_END_ERROR) Serial.println("End Failed");
    #endif
  });
  
  ArduinoOTA.begin();
  
  #if ENABLE_SERIAL_LOG
  Serial.println("OTA updates enabled");
  #endif
}

void printSystemInfo() {
  Serial.println("\n=== System Information ===");
  Serial.print("Chip Model: ");
  Serial.println(ESP.getChipModel());
  Serial.print("Chip Revision: ");
  Serial.println(ESP.getChipRevision());
  Serial.print("CPU Frequency: ");
  Serial.print(ESP.getCpuFreqMHz());
  Serial.println(" MHz");
  Serial.print("Free Heap: ");
  Serial.print(ESP.getFreeHeap());
  Serial.println(" bytes");
  Serial.print("Flash Size: ");
  Serial.print(ESP.getFlashChipSize());
  Serial.println(" bytes");
  Serial.println("========================\n");
}


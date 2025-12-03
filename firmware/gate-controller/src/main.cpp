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
#include "Logger.h"
#include <esp_task_wdt.h>
#include <time.h>

// Global objects
AsyncWebServer server(HTTP_PORT);
#if ENABLE_GATE1
GateController gate1(GATE1_RELAY_PIN, GATE1_SENSOR_PIN, "entrance");
#endif
#if ENABLE_GATE2
GateController gate2(GATE2_RELAY_PIN, GATE2_SENSOR_PIN, "garage");
#endif
Authentication auth;

// Function declarations
void setupWiFi(bool restartOnFailure = true);
void setupMDNS();
void setupNTP();
void setupOTA();
void printSystemInfo();

void setup() {
  // CRITICAL: Set relay pins to SAFE state FIRST (before anything else)
  // This prevents relay from being active during boot/reset
  // Only initialize pins for enabled gates
  #if ENABLE_GATE1
  pinMode(GATE1_RELAY_PIN, OUTPUT);
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(GATE1_RELAY_PIN, HIGH); // OFF for active-low
  } else {
    digitalWrite(GATE1_RELAY_PIN, LOW);   // OFF for active-high
  }
  #endif
  
  #if ENABLE_GATE2
  pinMode(GATE2_RELAY_PIN, OUTPUT);
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(GATE2_RELAY_PIN, HIGH);  // OFF for active-low
  } else {
    digitalWrite(GATE2_RELAY_PIN, LOW);  // OFF for active-high
  }
  #endif
  
  // Small delay to ensure relays are stable before continuing
  delay(50);
  
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

  logInfo("Booting Smart Gate Controller...");

  // OPTIMIZATION: Disable WiFi power saving to prevent random disconnects
  WiFi.setSleep(false);

  // Initialize gate controllers (will set pins again, but safe state is already set)
  #if ENABLE_GATE1
  gate1.begin();
  #endif
  #if ENABLE_GATE2
  gate2.begin();
  #endif

  // Initialize watchdog timer to prevent system hangs
  esp_task_wdt_init(WATCHDOG_TIMEOUT / 1000, true); // Convert ms to seconds
  esp_task_wdt_add(NULL); // Add current task to watchdog

  // Initialize authentication system
  auth.begin();

  // Connect to WiFi (restart on failure during initial setup)
  setupWiFi(true);

  // Setup NTP time synchronization
  setupNTP();

  // Setup mDNS
  if (ENABLE_MDNS) {
    setupMDNS();
  }

  // Initialize web server
  setupWebServer(server,
    #if ENABLE_GATE1
    gate1,
    #endif
    #if ENABLE_GATE2
    gate2,
    #endif
    auth);

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
  #if ENABLE_GATE1
  gate1.update();
  #endif
  #if ENABLE_GATE2
  gate2.update();
  #endif

  // Update authentication (cleanup expired tokens, rate limiting)
  auth.update();

  // Keep WiFi alive
  static unsigned long lastWiFiCheck = 0;
  static unsigned long wifiDownSince = 0;

  if (millis() - lastWiFiCheck > 1000) { // Check status every second
    if (WiFi.status() != WL_CONNECTED) {
      // If we just lost connection, record the time
      if (wifiDownSince == 0) {
        wifiDownSince = millis();
        logWarn("WiFi connection lost. Waiting for auto-reconnect...");
        
        // CRITICAL: Ensure relays are OFF before reconnecting WiFi
        // This prevents accidental gate activation during WiFi issues
        #if ENABLE_GATE1
        if (RELAY_ACTIVE_LOW) {
          digitalWrite(GATE1_RELAY_PIN, HIGH);
        } else {
          digitalWrite(GATE1_RELAY_PIN, LOW);
        }
        #endif
        #if ENABLE_GATE2
        if (RELAY_ACTIVE_LOW) {
          digitalWrite(GATE2_RELAY_PIN, HIGH);
        } else {
          digitalWrite(GATE2_RELAY_PIN, LOW);
        }
        #endif
      }

      // If down for too long, force a hard reset
      if (millis() - wifiDownSince > WIFI_RECOVER_TIMEOUT) {
        logWarn("WiFi recovery timeout. Performing hard WiFi reset");
        setupWiFi(false); // Hard reset
        wifiDownSince = 0; // Reset timer
      }
    } else {
      // We are connected
      if (wifiDownSince != 0) {
        logInfo("WiFi reconnected. IP: " + WiFi.localIP().toString());
        wifiDownSince = 0;
      }
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

void setupWiFi(bool restartOnFailure) {
  logInfo("Connecting to WiFi: " + String(WIFI_SSID));

  // Hard reset WiFi module before each connection attempt
  WiFi.disconnect(true, true);   // disconnect and erase old config
  WiFi.mode(WIFI_OFF);
  delay(200);
  WiFi.mode(WIFI_STA);

  // OPTIMIZATION: Explicitly enable auto-reconnect and disable sleep
  WiFi.setAutoReconnect(true);
  WiFi.setSleep(false);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED &&
         millis() - startAttempt < WIFI_CONNECT_TIMEOUT) {
    delay(500);
    Serial.print(".");
    
    // CRITICAL: Reset watchdog during WiFi connection
    // WiFi connection can take some time, but watchdog is 30 seconds
    // This prevents watchdog from restarting ESP32 during WiFi connection
    esp_task_wdt_reset();
  }

  if (WiFi.status() == WL_CONNECTED) {
    logInfo("WiFi connected. IP: " + WiFi.localIP().toString() + ", RSSI: " + String(WiFi.RSSI()) + " dBm");
  } else {
    logWarn("WiFi connection failed");
    
    // CRITICAL: Ensure relays are OFF before any action
    #if ENABLE_GATE1
    if (RELAY_ACTIVE_LOW) {
      digitalWrite(GATE1_RELAY_PIN, HIGH);
    } else {
      digitalWrite(GATE1_RELAY_PIN, LOW);
    }
    #endif
    #if ENABLE_GATE2
    if (RELAY_ACTIVE_LOW) {
      digitalWrite(GATE2_RELAY_PIN, HIGH);
    } else {
      digitalWrite(GATE2_RELAY_PIN, LOW);
    }
    #endif
    delay(100); // Give time for relays to deactivate
    
    if (restartOnFailure) {
      // Only restart during initial setup (not during reconnection attempts)
      logWarn("Ensuring relays are OFF before restart... Restarting in 5 seconds");
      delay(5000);
      ESP.restart();
    } else {
      // Don't restart - let loop() retry later
      logWarn("WiFi still disconnected, will retry connection in next loop iteration");
    }
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
    
    // Reset watchdog during NTP sync
    esp_task_wdt_reset();
    
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
    #if ENABLE_GATE1
    if (RELAY_ACTIVE_LOW) {
      digitalWrite(GATE1_RELAY_PIN, HIGH);
    } else {
      digitalWrite(GATE1_RELAY_PIN, LOW);
    }
    #endif
    #if ENABLE_GATE2
    if (RELAY_ACTIVE_LOW) {
      digitalWrite(GATE2_RELAY_PIN, HIGH);
    } else {
      digitalWrite(GATE2_RELAY_PIN, LOW);
    }
    #endif
    
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
  String info;
  info.reserve(160);
  info += "System Info - Chip: ";
  info += ESP.getChipModel();
  info += " (rev ";
  info += String(ESP.getChipRevision());
  info += "), CPU: ";
  info += String(ESP.getCpuFreqMHz());
  info += " MHz, Free heap: ";
  info += String(ESP.getFreeHeap());
  info += " bytes, Flash: ";
  info += String(ESP.getFlashChipSize());
  info += " bytes";

  logInfo(info);

  #if ENABLE_SERIAL_LOG
  Serial.println("\n=== System Information ===");
  Serial.println(info);
  Serial.println("========================\n");
  #endif
}


#ifndef CONFIG_H
#define CONFIG_H

// Hardware Configuration
// Gate 1 (Entrance Gate) - Currently NOT installed
#define ENABLE_GATE1 false         // Set to true when entrance gate is installed
#define GATE1_RELAY_PIN 18        // Przekaźnik sterujący bramą wjazdową
#define GATE1_SENSOR_PIN 19       // Czujnik stanu bramy (opcjonalny)

// Gate 2 (Garage Gate) - Currently installed and active
#define ENABLE_GATE2 true         // Garage gate is installed
#define GATE2_RELAY_PIN 23        // Przekaźnik sterujący bramą garażową (GPIO23 - zwykłe GPIO, bez dziwnych stanów przy starcie)
#define GATE2_SENSOR_PIN 17       // Czujnik stanu bramy (opcjonalny)

// Status LED
#define STATUS_LED_PIN 2          // Built-in LED na ESP32

// Relay Configuration
#define RELAY_ACTIVE_LOW true     // true = aktywny stan niski (LOW) - dla modułu MOD-01997 z optoizolacją
#define RELAY_PULSE_DURATION 500  // Czas impulsu przekaźnika w ms (500ms = 0.5s)

// Security Configuration
#define JWT_EXPIRATION_TIME 1800  // Token expiration time in seconds (30 minutes)
#define MAX_LOGIN_ATTEMPTS 5      // Max failed login attempts
#define RATE_LIMIT_WINDOW 60000   // Rate limit window in ms (1 minute)
#define MAX_REQUESTS_PER_WINDOW 50 // Max requests per window (increased for auto-refresh)

// Network Configuration
#define WIFI_CONNECT_TIMEOUT 20000 // WiFi connection timeout in ms
#define HTTP_PORT 80               // HTTP port (changed from 443 for testing)
#define ENABLE_MDNS true           // Enable mDNS for local discovery

// Sensor Configuration
#define SENSOR_DEBOUNCE_TIME 50    // Debounce time for sensors in ms
#define SENSOR_ACTIVE_LOW true     // true = sensor pulls pin LOW when active

// Auto-close Configuration (optional)
#define ENABLE_AUTO_CLOSE false    // Enable automatic gate closing
#define AUTO_CLOSE_DELAY 300000    // Auto-close delay in ms (5 minutes)

// Logging
#define ENABLE_SERIAL_LOG true     // Enable serial logging
#define LOG_LEVEL 3                // 0=NONE, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG

// System
#define WATCHDOG_TIMEOUT 30000      // Watchdog timeout in ms (30 seconds - increased for WiFi connection)

#endif // CONFIG_H


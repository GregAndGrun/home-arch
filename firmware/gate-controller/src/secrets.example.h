#ifndef SECRETS_H
#define SECRETS_H

// WiFi Configuration
#define WIFI_SSID "Username"
#define WIFI_PASSWORD "password"

// API Authentication
// IMPORTANT: Change these before first use!
#define API_USERNAME "admin"
#define API_PASSWORD "admin123"

// JWT Secret Key (used for token signing)
// Generate a random string (min 32 characters)
#define JWT_SECRET "jwt-secret-key"

// OTA Update Password
#define OTA_PASSWORD "change_this_ota_password"

// Device Configuration
#define DEVICE_NAME_GATE1 "gate-entrance"  // Brama wjazdowa
#define DEVICE_NAME_GATE2 "gate-garage"    // Brama garażowa

// mDNS hostname (will be accessible as http://gate-controller.local)
#define MDNS_HOSTNAME "gate-controller"

#endif // SECRETS_H


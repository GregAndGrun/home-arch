# Smart Gate Control - ESP32 Firmware

Secure firmware for ESP32-based gate controller with WiFi connectivity.

## Features

- 🔐 JWT-based authentication
- 🛡️ Rate limiting protection
- 🌐 WiFi connectivity with auto-reconnect
- 📡 mDNS support for local discovery
- 🔄 OTA updates support
- 📊 Real-time gate status monitoring
- 🚨 Multiple security layers
- 📝 Comprehensive logging

## Hardware Requirements

- ESP32 DevKit (ESP32-WROOM-32)
- 2-channel relay module (5V)
- 5V/2A power supply
- Reed switches (optional, for status sensing)
- Jumper wires

## Pin Configuration

Default GPIO assignments (configurable in `config.h`):

```cpp
GATE1_RELAY_PIN  = 16  // Entrance gate relay
GATE1_SENSOR_PIN = 17  // Entrance gate sensor
GATE2_RELAY_PIN  = 18  // Garage gate relay
GATE2_SENSOR_PIN = 19  // Garage gate sensor
STATUS_LED_PIN   = 2   // Built-in LED
```

## Installation

### Using PlatformIO (Recommended)

```bash
# Install PlatformIO
pip install platformio

# Navigate to firmware directory
cd firmware/gate-controller

# Copy and configure secrets
cp secrets.example.h secrets.h
nano secrets.h  # Edit with your credentials

# Build and upload
pio run --target upload

# Monitor serial output
pio device monitor
```

### Using Arduino IDE

1. Install Arduino IDE
2. Add ESP32 board support:
   - File → Preferences
   - Additional Board Manager URLs: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager → Search "ESP32" → Install

3. Install Libraries:
   - ArduinoJson (v6.21.3+)
   - ESPAsyncWebServer
   - AsyncTCP

4. Open `src/main.cpp`
5. Configure `secrets.h`
6. Select Board: "ESP32 Dev Module"
7. Click Upload

## Configuration

### Required: secrets.h

```cpp
#define WIFI_SSID "Your_WiFi_Network"
#define WIFI_PASSWORD "Your_WiFi_Password"

#define API_USERNAME "admin"
#define API_PASSWORD "your_secure_password"
#define JWT_SECRET "random_32_character_secret"

#define OTA_PASSWORD "ota_update_password"
```

⚠️ **NEVER commit secrets.h to version control!**

### Optional: config.h

Adjust GPIO pins, timeouts, security settings:

```cpp
#define MAX_LOGIN_ATTEMPTS 5
#define RATE_LIMIT_WINDOW 60000
#define JWT_EXPIRATION_TIME 1800
#define RELAY_PULSE_DURATION 500
#define ENABLE_AUTO_CLOSE false
```

## API Endpoints

All endpoints require authentication except `/` and `/api/health`.

### Public Endpoints

- `GET /` - API information
- `GET /api/health` - Health check

### Authentication

- `POST /api/auth/login` - Login (get JWT token)
  ```json
  Request: {"username":"admin","password":"pass"}
  Response: {"success":true,"token":"...","expiresIn":1800}
  ```

- `POST /api/auth/logout` - Logout (invalidate token)

### Gate Control

All require `Authorization: Bearer TOKEN` header.

- `GET /api/gates/status` - Get status of both gates
- `POST /api/gates/entrance/trigger` - Toggle entrance gate
- `POST /api/gates/entrance/open` - Open entrance gate
- `POST /api/gates/entrance/close` - Close entrance gate
- `POST /api/gates/garage/trigger` - Toggle garage gate
- `POST /api/gates/garage/open` - Open garage gate
- `POST /api/gates/garage/close` - Close garage gate

## Security Features

### Layer 1: Network Isolation
- ESP32 on private network
- No internet exposure

### Layer 2: Authentication
- Username/password login
- JWT tokens with expiration
- Secure token storage

### Layer 3: Rate Limiting
- Max 5 failed login attempts
- Max 10 requests per minute per IP
- Automatic IP blocking

### Layer 4: Input Validation
- All inputs sanitized
- JSON parsing with size limits
- Buffer overflow protection

### Layer 5: Logging
- All actions logged to serial
- Failed login attempts tracked
- Suspicious activity detection

## Testing

### Serial Monitor

Upload firmware and monitor output:

```
=== Smart Gate Controller ===
Connecting to WiFi: MyNetwork
.....
WiFi connected!
IP address: 192.168.1.100
Signal strength: -45 dBm
mDNS responder started: gate-controller.local
HTTP server started on port 443
```

### Test API

```bash
# Health check
curl http://192.168.1.100/api/health

# Login
curl -X POST http://192.168.1.100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# Get status (use token from login)
curl http://192.168.1.100/api/gates/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## OTA Updates

Update firmware wirelessly:

```bash
# Build for OTA
pio run -e esp32dev-ota

# Upload via OTA
pio run -e esp32dev-ota --target upload
```

Configure OTA in `platformio.ini`:
```ini
[env:esp32dev-ota]
upload_protocol = espota
upload_port = 192.168.1.100
upload_flags = --auth=your_ota_password
```

## Troubleshooting

### Won't Connect to WiFi

- Check SSID and password in secrets.h
- Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Move ESP32 closer to router
- Check router allows new devices

### Relay Doesn't Click

- Verify GPIO pin numbers in config.h
- Check wiring connections
- Measure voltage at relay pins (should be 5V)
- Test relay separately

### Memory Issues

Monitor free heap:
```cpp
Serial.print("Free heap: ");
Serial.println(ESP.getFreeHeap());
```

If low (<100KB):
- Reduce log level in config.h
- Decrease JWT_EXPIRATION_TIME
- Limit concurrent connections

### Watchdog Resets

If seeing "Guru Meditation Error":
- Add `delay(10)` in main loop
- Reduce complexity of loop operations
- Check for infinite loops
- Increase WATCHDOG_TIMEOUT

## Development

### Adding New Endpoints

1. Define endpoint in `WebServer.cpp`:
```cpp
server.on("/api/custom", HTTP_GET, [&auth](AsyncWebServerRequest *request) {
  if (!authorizeRequest(request, auth)) {
    request->send(401, "application/json", "{\"error\":\"Unauthorized\"}");
    return;
  }
  
  // Your logic here
  request->send(200, "application/json", "{\"success\":true}");
});
```

2. Update mobile app to call new endpoint

### Custom Gate Logic

Modify `GateController.cpp`:

```cpp
void GateController::customAction() {
  // Your custom logic
  trigger();
  // Additional actions
}
```

## Performance

Typical metrics:
- Boot time: ~5 seconds
- WiFi connection: ~3 seconds
- API response: <100ms
- Free heap: ~250KB
- Power consumption: ~150mA average

## Safety

⚠️ **IMPORTANT SAFETY NOTES:**

1. **Never bypass gate safety features**
2. **Always test with manual controls first**
3. **Keep physical remotes as backup**
4. **Ensure gate has obstruction sensors**
5. **Power loss should fail safe**

## Contributing

1. Test changes thoroughly
2. Update documentation
3. Follow existing code style
4. Test security features

## License

MIT

## Support

See main project documentation:
- [Installation Guide](../../docs/installation.md)
- [Wiring Guide](../../docs/wiring.md)
- [Security Guide](../../docs/security.md)


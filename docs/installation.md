# Installation Guide - Smart Gate Control System

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Hardware Installation](#hardware-installation)
4. [Software Installation](#software-installation)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Overview

This guide will walk you through the complete installation process for the Smart Gate Control system, including both hardware and software setup.

## Prerequisites

### Tools Required
- Screwdriver set
- Wire strippers
- Multimeter (for voltage testing)
- Soldering iron (optional, for permanent connections)
- Drill (for mounting enclosures)

### Software Required
- PlatformIO IDE or Arduino IDE
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (for mobile app development)

### Skills Required
- Basic electronics knowledge
- Basic programming knowledge
- Understanding of home networking

## Hardware Installation

### Step 1: Prepare Components

For each gate, you'll need:
- 1x ESP32 DevKit
- 1x 2-channel relay module
- 1x 5V/2A power supply
- 1x Reed switch (optional, for gate status)
- 1x IP65 enclosure
- Jumper wires and connectors

### Step 2: Wiring Connections

**IMPORTANT: Disconnect power before making any connections!**

#### ESP32 to Relay Module

| ESP32 Pin | Relay Pin | Purpose |
|-----------|-----------|---------|
| GPIO 16   | IN1       | Gate 1 Relay Control |
| GPIO 18   | IN2       | Gate 2 Relay Control |
| GND       | GND       | Common Ground |
| 5V        | VCC       | Power Supply |

#### ESP32 to Reed Switch (Optional)

| ESP32 Pin | Reed Switch | Purpose |
|-----------|-------------|---------|
| GPIO 17   | Pin 1       | Gate 1 Status Sensor |
| GPIO 19   | Pin 1       | Gate 2 Status Sensor |
| GND       | Pin 2       | Common Ground |

**Note:** Reed switches are connected with internal pull-up resistors enabled on ESP32.

#### Relay to Existing Gate Control

For each gate:
1. Locate the existing remote control receiver or button terminals
2. Connect relay NO (Normally Open) and COM (Common) in parallel with the existing button
3. This allows both the remote and ESP32 to control the gate

**WARNING:** 
- Do NOT disconnect existing controls
- Relays should be connected in PARALLEL, not in series
- Test with existing remote first to ensure it still works

### Step 3: Mounting

1. Place ESP32 and relay module inside IP65 enclosure
2. Ensure adequate ventilation (ESP32 can get warm)
3. Mount enclosure near gate motor or existing control box
4. Route power cable through waterproof gland
5. Secure all connections with cable ties

### Step 4: Power Supply

1. Connect 5V power supply to ESP32
2. Verify voltage with multimeter (should be 5V ±0.25V)
3. Ensure power supply can deliver at least 2A
4. Use a surge protector for outdoor installations

### Step 5: Reed Switch Installation (Optional)

1. Mount magnet on the moving part of gate
2. Mount reed switch on the fixed part (gate post)
3. Align them so they're close when gate is closed
4. Gap should be <1cm for reliable detection
5. Test by manually opening/closing gate

## Software Installation

### Firmware (ESP32)

#### Method 1: Using PlatformIO (Recommended)

```bash
# Navigate to firmware directory
cd firmware/gate-controller

# Copy and configure secrets
cp secrets.example.h secrets.h
nano secrets.h  # Edit with your WiFi credentials

# Build and upload
pio run --target upload

# Monitor serial output
pio device monitor
```

#### Method 2: Using Arduino IDE

1. Open Arduino IDE
2. Install ESP32 board support: https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html
3. Install required libraries:
   - ArduinoJson
   - ESPAsyncWebServer
   - AsyncTCP
4. Open `firmware/gate-controller/src/main.cpp`
5. Configure settings in `config.h` and `secrets.h`
6. Select board: "ESP32 Dev Module"
7. Click Upload

### Mobile Application

#### For Development/Testing

```bash
# Navigate to mobile app directory
cd mobile-app/gate-app

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

#### For Production

1. Build Android APK:
```bash
expo build:android
```

2. Build iOS IPA (requires Apple Developer account):
```bash
expo build:ios
```

## Configuration

### 1. WiFi Configuration

Edit `firmware/gate-controller/secrets.h`:

```cpp
#define WIFI_SSID "Your_WiFi_Network"
#define WIFI_PASSWORD "Your_Strong_Password"
```

**Recommendations:**
- Use 2.4GHz WiFi (better range)
- Place router close to gate controllers
- Use static IP addresses for ESP32 devices

### 2. Security Configuration

```cpp
#define API_USERNAME "admin"
#define API_PASSWORD "your_secure_password_here"
#define JWT_SECRET "your_random_secret_key_min_32_chars"
```

**IMPORTANT:**
- Change default passwords immediately!
- Use strong passwords (min 12 characters)
- JWT_SECRET should be a random string (32+ characters)
- Never commit secrets.h to version control

### 3. GPIO Pin Configuration

If needed, adjust pins in `firmware/gate-controller/config.h`:

```cpp
#define GATE1_RELAY_PIN 16
#define GATE1_SENSOR_PIN 17
#define GATE2_RELAY_PIN 18
#define GATE2_SENSOR_PIN 19
```

### 4. Mobile App Configuration

Edit `mobile-app/gate-app/src/config/api.config.ts`:

```typescript
export const DEFAULT_GATE_ENTRANCE_IP = '192.168.1.100';
export const DEFAULT_GATE_GARAGE_IP = '192.168.1.101';
```

Set these to your ESP32 IP addresses.

### 5. Network Setup

#### Option A: Local Network Only (Recommended for beginners)
- Connect phone to same WiFi as ESP32
- Access gates only when at home
- Most secure option

#### Option B: VPN Access (Recommended for remote access)
- Set up VPN on your router (e.g., WireGuard, OpenVPN)
- Connect to home network via VPN when away
- Access gates as if you were home
- Secure and flexible

#### Option C: Port Forwarding (NOT RECOMMENDED)
- Exposes ESP32 to internet
- Security risk even with authentication
- Only use if you understand the risks

## Testing

### 1. Initial Power-On Test

1. Power on ESP32
2. Monitor serial output:
```
=== Smart Gate Controller ===
Connecting to WiFi: YourNetwork
WiFi connected!
IP address: 192.168.1.100
mDNS responder started: gate-controller.local
HTTP server started on port 443
```

### 2. Network Connectivity Test

From computer on same network:
```bash
# Test ping
ping 192.168.1.100

# Test HTTP endpoint
curl http://192.168.1.100/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 123,
  "freeHeap": 234567,
  "wifiRSSI": -45
}
```

### 3. Authentication Test

```bash
# Login
curl -X POST http://192.168.1.100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

Expected response:
```json
{
  "success": true,
  "token": "abc123...",
  "expiresIn": 1800
}
```

### 4. Gate Control Test

**IMPORTANT: Stand clear of gate before testing!**

```bash
# Trigger gate (use token from login)
curl -X POST http://192.168.1.100/api/gates/entrance/trigger \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Mobile App Test

1. Open mobile app
2. Login with credentials
3. Should see both gates on dashboard
4. Test biometric authentication
5. Trigger each gate and verify operation

## Troubleshooting

### ESP32 Won't Connect to WiFi

**Symptoms:** Serial shows "Connecting..." but never "WiFi connected"

**Solutions:**
1. Verify WiFi credentials in secrets.h
2. Check WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
3. Move ESP32 closer to router
4. Check router allows new device connections
5. Try disabling WiFi isolation/AP isolation

### Mobile App Can't Connect

**Symptoms:** "No response from server" error

**Solutions:**
1. Verify phone is on same WiFi network
2. Check ESP32 IP address is correct
3. Ping ESP32 from phone (use network tools app)
4. Check firewall isn't blocking connections
5. Verify ESP32 is powered on and running

### Gate Doesn't Respond

**Symptoms:** Request succeeds but gate doesn't move

**Solutions:**
1. Check relay wiring to gate control
2. Verify relay is clicking (listen for sound)
3. Test existing remote still works
4. Check power supply to relays
5. Verify GPIO pin configuration
6. Check RELAY_ACTIVE_LOW setting

### Sensor Shows Wrong State

**Symptoms:** App shows "open" when gate is closed

**Solutions:**
1. Check reed switch alignment
2. Verify wiring connections
3. Test sensor with multimeter
4. Adjust SENSOR_ACTIVE_LOW setting
5. Check magnet is strong enough

### Authentication Fails

**Symptoms:** 401 Unauthorized errors

**Solutions:**
1. Verify credentials are correct
2. Check token hasn't expired (30 min default)
3. Clear app data and login again
4. Verify API_USERNAME and API_PASSWORD match
5. Check for rate limiting (5 attempts/min)

### System Crashes/Reboots

**Symptoms:** ESP32 restarts unexpectedly

**Solutions:**
1. Check power supply (should be 2A minimum)
2. Verify no short circuits
3. Update to latest firmware
4. Check for memory leaks in serial output
5. Ensure adequate cooling

## Next Steps

After successful installation:

1. Read [Security Guide](security.md) for hardening
2. Set up automatic backups of configuration
3. Consider adding cameras for visual verification
4. Explore automation options (schedules, geofencing)
5. Document your specific setup for future reference

## Support

For issues not covered here:
1. Check GitHub issues
2. Review logs from serial monitor
3. Verify hardware connections
4. Test each component individually

## Safety Warnings

⚠️ **READ CAREFULLY:**

1. **Electrical Safety**
   - Always disconnect power before working on wiring
   - Use properly rated components
   - Follow local electrical codes

2. **Gate Safety**
   - Test gate sensors are working
   - Ensure gate stops if obstructed
   - Keep remote controls as backup
   - Never bypass safety features

3. **Security**
   - Change all default passwords
   - Use strong authentication
   - Keep firmware updated
   - Monitor access logs

4. **Liability**
   - This is a DIY project
   - Install at your own risk
   - Ensure compliance with local regulations
   - Consider professional installation for critical applications


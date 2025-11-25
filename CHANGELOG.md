# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-23

### Added

#### ESP32 Firmware
- WiFi connectivity with auto-reconnect
- RESTful API server
- JWT-based authentication
- Rate limiting protection (5 attempts/min)
- Support for 2 gates (entrance and garage)
- Reed switch support for gate status
- mDNS support for local discovery
- Serial logging with configurable levels
- OTA update support
- Watchdog timer protection
- Auto-close feature (optional)

#### Mobile App
- React Native (Expo) application
- Login with username/password
- JWT token management
- Biometric authentication (Touch ID/Face ID)
- PIN authentication fallback
- Dashboard with gate status
- Real-time status updates (5s refresh)
- Network connectivity monitoring
- Offline mode handling
- Pull-to-refresh
- App lock on background

#### Documentation
- Complete installation guide
- Detailed wiring diagrams
- Security best practices guide
- Shopping list with Polish suppliers
- Testing procedures
- Troubleshooting guide
- API documentation
- Contributing guidelines

#### Security Features
- Multi-layer security (6 layers)
- Brute force protection
- IP blocking after failed attempts
- Token-based sessions with expiration
- Rate limiting on all endpoints
- Input validation and sanitization
- Secure credential storage (mobile)
- Logging of security events

#### Scripts
- Certificate generation script
- API testing script
- Automated test suite

### Security

- JWT tokens expire after 30 minutes
- Passwords never stored in plaintext
- Rate limiting prevents brute force
- All API endpoints require authentication (except health/info)
- Mobile app uses secure keychain storage

### Known Issues

- HTTP only (HTTPS planned for future release)
- Self-signed certificates require manual trust
- No push notifications yet
- No scheduling/automation features yet

### Notes

- Tested with ESP32-WROOM-32 DevKit
- Tested on iOS 15+ and Android 10+
- Requires 2.4GHz WiFi (5GHz not supported by ESP32)
- Local network only (VPN required for remote access)

## [Unreleased]

### Planned Features
- HTTPS/TLS support
- Push notifications
- Gate operation scheduling
- Geofencing (auto-open when arriving home)
- Google Assistant/Alexa integration
- Home Assistant integration
- Multiple user support
- Activity logs in app
- Settings screen
- Language support (Polish, English)
- Dark mode

### Planned Improvements
- Improved error messages
- Better offline handling
- Faster status updates via WebSocket
- Cloud sync (optional)
- Backup/restore configuration


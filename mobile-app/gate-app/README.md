# Smart Home - Mobile App

React Native (Expo) application for controlling smart home devices.

## Features

- 🔐 Secure authentication with JWT tokens
- 🔒 Biometric/PIN protection
- 🚪 Control gates, lights, temperature, and other smart devices
- 📊 Real-time device status
- 🌐 Network status monitoring
- 🔄 Auto-refresh every 5 seconds
- 📱 Cross-platform (iOS & Android)

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

## Configuration

Edit `src/config/api.config.ts` to set your ESP32 IP addresses:

```typescript
export const DEFAULT_GATE_ENTRANCE_IP = '192.168.1.100';
export const DEFAULT_GATE_GARAGE_IP = '192.168.1.101';
```

## Project Structure

```
src/
├── components/     # Reusable UI components
│   └── GateCard.tsx
├── screens/        # App screens
│   ├── BiometricLockScreen.tsx
│   ├── DashboardScreen.tsx
│   └── LoginScreen.tsx
├── services/       # Business logic
│   ├── ApiService.ts
│   ├── BiometricsService.ts
│   └── StorageService.ts
├── types/          # TypeScript types
│   └── index.ts
└── config/         # Configuration
    └── api.config.ts
```

## Usage

1. Connect phone to same WiFi as ESP32
2. Open app
3. Login with credentials:
   - **Username:** `admin`
   - **Password:** `test123`
   - (lub inne ustawione w `firmware/gate-controller/secrets.h`)
4. Authenticate with biometrics/PIN (skip on web)
5. Toggle gates from dashboard

⚠️ **Bez działającego ESP32:** Login nie zadziała - zobaczysz tylko UI

## Security

- Tokens stored in secure keychain
- Biometric authentication on app resume
- Automatic token expiration (30 min)
- Secure communication with ESP32

## Building for Production

### Android

```bash
expo build:android
```

### iOS

```bash
expo build:ios
```

Requires Apple Developer account for iOS build.

## Troubleshooting

**"No response from server"**
- Check ESP32 is powered on
- Verify IP address in config
- Ensure phone is on same WiFi network

**"Authentication failed"**
- Check credentials
- Token may have expired - login again

**Biometrics not working**
- Enable biometrics in phone settings
- Grant app permission to use biometrics

## License

MIT


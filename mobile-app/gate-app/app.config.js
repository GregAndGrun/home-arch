// Load environment variables from .env file
require('dotenv').config({ path: '.env' });

module.exports = {
    expo: {
    name: 'Smart Home',
    slug: 'smart-home',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'smarthome',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    ios: {
      bundleIdentifier: 'com.grunert.smarthome',
      supportsTablet: true,
      jsEngine: 'hermes', // Enable Hermes for better performance and DevTools support
      infoPlist: {
        // Notification permissions are handled by expo-notifications
      },
    },
    android: {
      package: 'com.smarthome.app',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#F5A623',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      jsEngine: 'hermes',
      allowBackup: false,
      permissions: [
        'android.permission.INTERNET',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.VIBRATE',
      ],
      usesCleartextTraffic: true,
    },
    // Disable dev menu in production builds
    developmentClient: {
      silentLaunch: true,
    },
    plugins: [
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#000000',
          sounds: [],
        },
      ],
    ],
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: '45c2c77b-51c8-4c87-b7f2-7d9b772be609',
      },
      // Expose environment variables to the app via expo-constants
      gateEntranceIp: process.env.GATE_ENTRANCE_IP || '192.168.1.100',
      gateGarageIp: process.env.GATE_GARAGE_IP || '192.168.0.103',
      gateGaragePort: process.env.GATE_GARAGE_PORT || '80',
      gateEntrancePort: process.env.GATE_ENTRANCE_PORT || '80',
      apiTimeout: parseInt(process.env.API_TIMEOUT || '10000', 10),
      apiRetryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS || '3', 10),
      apiRetryDelay: parseInt(process.env.API_RETRY_DELAY || '1000', 10),
      tokenRefreshThreshold: parseInt(process.env.TOKEN_REFRESH_THRESHOLD || '300', 10),
      wireguardTunnelName: process.env.WIREGUARD_TUNNEL_NAME || 'Home',
    },
  },
};


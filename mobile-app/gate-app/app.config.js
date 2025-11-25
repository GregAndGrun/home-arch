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
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        // Notification permissions are handled by expo-notifications
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.VIBRATE',
      ],
    },
    plugins: [
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#FF6B35',
          sounds: [],
        },
      ],
    ],
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      // Expose environment variables to the app via expo-constants
      gateEntranceIp: process.env.GATE_ENTRANCE_IP || '192.168.1.100',
      gateGarageIp: process.env.GATE_GARAGE_IP || '192.168.1.103',
      apiTimeout: parseInt(process.env.API_TIMEOUT || '10000', 10),
      apiRetryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS || '3', 10),
      apiRetryDelay: parseInt(process.env.API_RETRY_DELAY || '1000', 10),
      tokenRefreshThreshold: parseInt(process.env.TOKEN_REFRESH_THRESHOLD || '300', 10),
      wireguardTunnelName: process.env.WIREGUARD_TUNNEL_NAME || 'Home',
    },
  },
};


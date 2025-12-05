// API Configuration
import Constants from 'expo-constants';

// Load configuration from environment variables (via expo-constants)
// These values come from .env file (see .env.example for template)
const extra = Constants.expoConfig?.extra || {};

// Log configuration for debugging
console.log('[api.config] Loading configuration from expo-constants:', {
  gateEntranceIp: extra.gateEntranceIp,
  gateGarageIp: extra.gateGarageIp,
  gateEntrancePort: extra.gateEntrancePort,
  gateGaragePort: extra.gateGaragePort,
});

// Default ESP32 IP addresses (loaded from .env or fallback to defaults)
export const DEFAULT_GATE_ENTRANCE_IP = extra.gateEntranceIp || '192.168.1.100';
export const DEFAULT_GATE_GARAGE_IP = extra.gateGarageIp || '192.168.0.103';
export const DEFAULT_GATE_ENTRANCE_PORT = extra.gateEntrancePort || '80';
export const DEFAULT_GATE_GARAGE_PORT = extra.gateGaragePort || '80';

console.log('[api.config] Final configuration:', {
  DEFAULT_GATE_ENTRANCE_IP,
  DEFAULT_GATE_GARAGE_IP,
  DEFAULT_GATE_ENTRANCE_PORT,
  DEFAULT_GATE_GARAGE_PORT,
});

// API endpoints
export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  GATES_STATUS: '/api/gates/status',
  GATE_ENTRANCE_TRIGGER: '/api/gates/entrance/trigger',
  GATE_ENTRANCE_OPEN: '/api/gates/entrance/open',
  GATE_ENTRANCE_CLOSE: '/api/gates/entrance/close',
  GATE_GARAGE_TRIGGER: '/api/gates/garage/trigger',
  GATE_GARAGE_OPEN: '/api/gates/garage/open',
  GATE_GARAGE_CLOSE: '/api/gates/garage/close',
  HEALTH: '/api/health',
};

// Network settings (loaded from .env or fallback to defaults)
export const API_TIMEOUT = extra.apiTimeout || 10000; // 10 seconds
export const RETRY_ATTEMPTS = extra.apiRetryAttempts || 3;
export const RETRY_DELAY = extra.apiRetryDelay || 1000; // 1 second

// Security settings (loaded from .env or fallback to defaults)
export const TOKEN_REFRESH_THRESHOLD = extra.tokenRefreshThreshold || 300; // Refresh token 5 minutes before expiry

// VPN settings (loaded from .env or fallback to defaults)
export const WIREGUARD_TUNNEL_NAME = extra.wireguardTunnelName || 'Home'; // Name of WireGuard tunnel to activate


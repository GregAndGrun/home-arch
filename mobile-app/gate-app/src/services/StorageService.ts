import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const CREDENTIALS_SERVICE = 'SmartHome';
const SETTINGS_KEY = 'app_settings';
const DEVICE_CONFIG_KEY = 'device_config';

// Check if Keychain is available and working
// In iOS simulator, Keychain may not work properly, so we'll use AsyncStorage as fallback
let isKeychainAvailable = false;
let keychainChecked = false;

async function checkKeychainAvailability(): Promise<boolean> {
  if (keychainChecked) return isKeychainAvailable;
  
  // Always use AsyncStorage for web
  if (Platform.OS === 'web') {
    isKeychainAvailable = false;
    keychainChecked = true;
    return false;
  }
  
  // Try to use Keychain, but fallback to AsyncStorage if it fails
  try {
    // Test if Keychain is available by checking if the function exists
    if (typeof Keychain.getGenericPassword === 'function' && Keychain.getGenericPassword !== null) {
      // Try a test read to see if Keychain actually works
      await Keychain.getGenericPassword({ service: CREDENTIALS_SERVICE });
      isKeychainAvailable = true;
    } else {
      isKeychainAvailable = false;
    }
  } catch (error) {
    // Keychain not available (e.g., iOS simulator), use AsyncStorage
    console.warn('Keychain not available, using AsyncStorage fallback:', error);
    isKeychainAvailable = false;
  }
  
  keychainChecked = true;
  return isKeychainAvailable;
}

export class StorageService {
  // Token management using secure Keychain (or AsyncStorage fallback for web/iOS simulator)
  static async saveToken(token: string): Promise<void> {
    try {
      const useKeychain = await checkKeychainAvailability();
      if (useKeychain) {
        try {
          await Keychain.setGenericPassword(TOKEN_KEY, token, {
            service: CREDENTIALS_SERVICE,
          });
          return;
        } catch (keychainError) {
          // Keychain failed, fallback to AsyncStorage
          console.warn('Keychain save failed, using AsyncStorage:', keychainError);
        }
      }
      // Fallback to AsyncStorage for web/iOS simulator
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  }

  static async getToken(): Promise<string | null> {
    try {
      // Add timeout to prevent hanging on Keychain check
      const keychainCheckPromise = checkKeychainAvailability();
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(false);
        }, 2000); // 2 second timeout
      });
      
      const useKeychain = await Promise.race([keychainCheckPromise, timeoutPromise]);
      let token: string | null = null;
      
      if (useKeychain) {
        try {
          // Add timeout to Keychain operation to prevent hanging
          const keychainPromise = Keychain.getGenericPassword({
            service: CREDENTIALS_SERVICE,
          });
          const keychainTimeout = new Promise<false>((resolve) => {
            setTimeout(() => {
              resolve(false);
            }, 2000); // 2 second timeout
          });
          
          const credentials = await Promise.race([keychainPromise, keychainTimeout]) as { username: string; password: string } | false | null;
          
          if (credentials && credentials !== false && typeof credentials === 'object' && 'password' in credentials) {
            token = credentials.password;
          }
        } catch (keychainError) {
          // Keychain failed, fallback to AsyncStorage
          console.warn('[StorageService] Keychain get failed, using AsyncStorage:', keychainError);
        }
      }
      
      // Fallback to AsyncStorage for web/iOS simulator
      if (!token) {
        token = await AsyncStorage.getItem(TOKEN_KEY);
      }
      
      // Check if token is valid (not expired)
      if (token) {
        if (!this.isTokenValid(token)) {
          console.warn('[StorageService] Token is expired, clearing it');
          await this.clearToken();
          return null;
        }
      }
      
      return token;
    } catch (error) {
      console.error('[StorageService] Error getting token:', error);
      return null;
    }
  }

  // Decode JWT token and check if it's expired
  static isTokenValid(token: string): boolean {
    try {
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false; // Invalid JWT format
      }

      // Decode payload (second part)
      const payload = parts[1];
      // Add padding if needed for base64 decoding
      const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
      const decodedPayload = JSON.parse(atob(paddedPayload));

      // Check expiration
      if (decodedPayload.exp) {
        const expirationTime = decodedPayload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        
        // Token is valid if expiration time is in the future
        // Add 5 second buffer to account for clock skew
        return expirationTime > (currentTime + 5000);
      }

      // If no expiration claim, assume token is valid (shouldn't happen in production)
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  static async clearToken(): Promise<void> {
    try {
      const useKeychain = await checkKeychainAvailability();
      if (useKeychain) {
        try {
          await Keychain.resetGenericPassword({
            service: CREDENTIALS_SERVICE,
          });
          // Also clear AsyncStorage as backup
          await AsyncStorage.removeItem(TOKEN_KEY);
          return;
        } catch (keychainError) {
          // Keychain failed, fallback to AsyncStorage
          console.warn('Keychain clear failed, using AsyncStorage:', keychainError);
        }
      }
      
      // Fallback to AsyncStorage for web/iOS simulator
      await AsyncStorage.removeItem(TOKEN_KEY);
      
      // Also clear from localStorage directly (for web browsers)
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.removeItem(TOKEN_KEY);
          // Also try with @ prefix (AsyncStorage sometimes uses this)
          window.localStorage.removeItem('@' + TOKEN_KEY);
          // Clear all AsyncStorage keys
          const keys = Object.keys(window.localStorage);
          keys.forEach(key => {
            if (key.includes(TOKEN_KEY) || key.includes('auth_token')) {
              window.localStorage.removeItem(key);
            }
          });
        } catch (e) {
          console.warn('localStorage clear failed:', e);
        }
      }
      
      // Verify it's cleared
      const remaining = await AsyncStorage.getItem(TOKEN_KEY);
      if (remaining) {
        console.warn('Token still exists after removeItem, trying again');
        await AsyncStorage.removeItem(TOKEN_KEY);
      }
      
    } catch (error) {
      console.error('Error clearing token:', error);
      // Force clear even if error
      try {
        await AsyncStorage.removeItem(TOKEN_KEY);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(TOKEN_KEY);
        }
      } catch (e) {
        console.error('Force clear also failed:', e);
      }
    }
  }

  static clearTokenSyncForWeb(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem('@' + TOKEN_KEY);
      if (window.sessionStorage) {
        window.sessionStorage.removeItem(TOKEN_KEY);
      }
    } catch (error) {
      console.warn('clearTokenSyncForWeb failed:', error);
    }
  }

  // Credentials management (username/password) - optional for "remember me"
  static async saveCredentials(username: string, password: string): Promise<void> {
    try {
      await Keychain.setGenericPassword(username, password);
    } catch (error) {
      console.error('Error saving credentials:', error);
      throw error;
    }
  }

  static async getCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      const credentials = await Keychain.getGenericPassword();
      
      if (credentials) {
        return {
          username: credentials.username,
          password: credentials.password,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting credentials:', error);
      return null;
    }
  }

  static async clearCredentials(): Promise<void> {
    try {
      await Keychain.resetGenericPassword();
    } catch (error) {
      console.error('Error clearing credentials:', error);
    }
  }

  // Settings management using AsyncStorage
  static async saveSettings(settings: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(settings);
      await AsyncStorage.setItem(SETTINGS_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  static async getSettings(): Promise<any | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error getting settings:', error);
      return null;
    }
  }

  static async clearSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SETTINGS_KEY);
    } catch (error) {
      console.error('Error clearing settings:', error);
    }
  }

  // Device configuration management (stored in secure storage for sensitive IPs)
  static async saveDeviceConfig(devices: any[]): Promise<void> {
    try {
      const useKeychain = await checkKeychainAvailability();
      const jsonValue = JSON.stringify(devices);
      
      if (useKeychain) {
        try {
          await Keychain.setGenericPassword(DEVICE_CONFIG_KEY, jsonValue, {
            service: CREDENTIALS_SERVICE + '_devices',
          });
          return;
        } catch (keychainError) {
          console.warn('Keychain save failed, using AsyncStorage:', keychainError);
        }
      }
      
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(DEVICE_CONFIG_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving device config:', error);
      throw error;
    }
  }

  static async getDeviceConfig(): Promise<any[] | null> {
    try {
      const useKeychain = await checkKeychainAvailability();
      
      if (useKeychain) {
        try {
          const credentials = await Keychain.getGenericPassword({
            service: CREDENTIALS_SERVICE + '_devices',
          });
          
          if (credentials) {
            return JSON.parse(credentials.password);
          }
          return null;
        } catch (keychainError) {
          console.warn('Keychain get failed, using AsyncStorage:', keychainError);
        }
      }
      
      // Fallback to AsyncStorage
      const jsonValue = await AsyncStorage.getItem(DEVICE_CONFIG_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error getting device config:', error);
      return null;
    }
  }

  static async clearDeviceConfig(): Promise<void> {
    try {
      const useKeychain = await checkKeychainAvailability();
      
      if (useKeychain) {
        try {
          await Keychain.resetGenericPassword({
            service: CREDENTIALS_SERVICE + '_devices',
          });
        } catch (keychainError) {
          console.warn('Keychain clear failed, using AsyncStorage:', keychainError);
        }
      }
      
      // Fallback to AsyncStorage
      await AsyncStorage.removeItem(DEVICE_CONFIG_KEY);
    } catch (error) {
      console.error('Error clearing device config:', error);
    }
  }

  // Username management
  static async saveUsername(username: string): Promise<void> {
    try {
      await AsyncStorage.setItem('username', username);
    } catch (error) {
      console.error('Error saving username:', error);
    }
  }

  static async getUsername(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('username');
    } catch (error) {
      console.error('Error getting username:', error);
      return null;
    }
  }

  // Clear all data
  static async clearAll(): Promise<void> {
    await this.clearToken();
    await this.clearCredentials();
    await this.clearSettings();
    await this.clearDeviceConfig();
  }
}

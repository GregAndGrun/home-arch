import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const CREDENTIALS_SERVICE = 'SmartHome_Credentials';
const TOKEN_SERVICE = 'SmartHome_Token';
const SETTINGS_KEY = 'app_settings';
const DEVICE_CONFIG_KEY = 'device_config';

// Check if Keychain is available and working
// In iOS simulator, Keychain may not work properly, so we'll use AsyncStorage as fallback
let isKeychainAvailable = false;
let keychainChecked = false;

async function checkKeychainAvailability(): Promise<boolean> {
  if (keychainChecked) return isKeychainAvailable;
  
  if (Platform.OS === 'web') {
    isKeychainAvailable = false;
    keychainChecked = true;
    return false;
  }
  
  try {
    if (!Keychain || typeof Keychain.getGenericPassword !== 'function' || Keychain.getGenericPassword === null) {
      isKeychainAvailable = false;
      keychainChecked = true;
      return false;
    }
    
    const testPromise = Keychain.getGenericPassword({ service: TOKEN_SERVICE });
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 2000);
    });
    
    await Promise.race([testPromise, timeoutPromise]);
    isKeychainAvailable = true;
  } catch (error) {
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
            service: TOKEN_SERVICE,
          });
          return;
        } catch (keychainError) {
          // Keychain failed, fallback to AsyncStorage
        }
      }
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  }

  static async getToken(): Promise<string | null> {
    try {
      const keychainCheckPromise = checkKeychainAvailability();
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 5000);
      });
      
      const useKeychain = await Promise.race([keychainCheckPromise, timeoutPromise]);
      let token: string | null = null;
      
      if (useKeychain) {
        try {
          const keychainPromise = Keychain.getGenericPassword({
            service: TOKEN_SERVICE,
          });
          const keychainTimeout = new Promise<false>((resolve) => {
            setTimeout(() => resolve(false), 5000);
          });
          
          const credentials = await Promise.race([keychainPromise, keychainTimeout]) as { username: string; password: string } | false | null;
          
          if (credentials && typeof credentials === 'object' && 'password' in credentials) {
            token = credentials.password;
          }
        } catch (keychainError) {
          // Keychain failed, fallback to AsyncStorage
        }
      }
      
      if (!token) {
        token = await AsyncStorage.getItem(TOKEN_KEY);
      }
      
      if (token && !this.isTokenValid(token)) {
        await this.clearToken();
        return null;
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
            service: TOKEN_SERVICE,
          });
        } catch (keychainError) {
          // Keychain failed, continue to AsyncStorage
        }
      }
      
      await AsyncStorage.removeItem(TOKEN_KEY);
      
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.removeItem(TOKEN_KEY);
          window.localStorage.removeItem('@' + TOKEN_KEY);
        } catch (e) {
          // Ignore localStorage errors
        }
      }
    } catch (error) {
      console.error('Error clearing token:', error);
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
      // Ignore errors
    }
  }

  // Credentials management (username/password) - optional for "remember me"
  static async saveCredentials(username: string, password: string): Promise<void> {
    try {
      const useKeychain = await checkKeychainAvailability();
      if (useKeychain) {
        try {
          await Keychain.setGenericPassword(username, password, {
            service: CREDENTIALS_SERVICE,
          });
          return;
        } catch (keychainError) {
          // Keychain failed, fallback to AsyncStorage
        }
      }
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(`${CREDENTIALS_SERVICE}_username`, username);
      await AsyncStorage.setItem(`${CREDENTIALS_SERVICE}_password`, password);
    } catch (error) {
      console.error('[StorageService] Error saving credentials:', error);
      // Don't throw - allow app to continue
    }
  }

  static async getCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      const useKeychain = await checkKeychainAvailability();
      if (useKeychain) {
        try {
          const credentials = await Keychain.getGenericPassword({
            service: CREDENTIALS_SERVICE,
          });
          if (credentials && typeof credentials === 'object' && 'username' in credentials && 'password' in credentials) {
            return {
              username: credentials.username,
              password: credentials.password,
            };
          }
        } catch (keychainError) {
          // Keychain failed, fallback to AsyncStorage
        }
      }
      // Fallback to AsyncStorage
      const username = await AsyncStorage.getItem(`${CREDENTIALS_SERVICE}_username`);
      const password = await AsyncStorage.getItem(`${CREDENTIALS_SERVICE}_password`);
      if (username && password) {
        return { username, password };
      }
      return null;
    } catch (error) {
      console.error('[StorageService] Error getting credentials:', error);
      return null;
    }
  }

  static async clearCredentials(): Promise<void> {
    try {
      const useKeychain = await checkKeychainAvailability();
      if (useKeychain) {
        try {
          await Keychain.resetGenericPassword({
            service: CREDENTIALS_SERVICE,
          });
        } catch (keychainError) {
          // Keychain failed, continue to AsyncStorage
        }
      }
      // Fallback to AsyncStorage
      await AsyncStorage.removeItem(`${CREDENTIALS_SERVICE}_username`);
      await AsyncStorage.removeItem(`${CREDENTIALS_SERVICE}_password`);
    } catch (error) {
      console.error('[StorageService] Error clearing credentials:', error);
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
          // Keychain failed, fallback to AsyncStorage
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
          // Keychain failed, fallback to AsyncStorage
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
          // Keychain failed, continue to AsyncStorage
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


import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  API_ENDPOINTS,
  API_TIMEOUT,
  DEFAULT_GATE_ENTRANCE_IP,
  DEFAULT_GATE_GARAGE_IP,
  DEFAULT_GATE_ENTRANCE_PORT,
  DEFAULT_GATE_GARAGE_PORT,
  DEFAULT_BLINDS_LIVING_ROOM_FIX_IP,
  DEFAULT_BLINDS_LIVING_ROOM_TERRACE_IP,
} from '../config/api.config';
import {
  LoginRequest,
  LoginResponse,
  GateActionResponse,
  ApiError,
  GateType,
} from '../types';
import { StorageService } from './StorageService';
import ActivityService from './ActivityService';
import TasmotaApiService from './TasmotaApiService';

class ApiService {
  private axiosInstance: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Initialize with default IP, will be updated if custom IP is saved
    this.baseURL = `http://${DEFAULT_GATE_GARAGE_IP}:${DEFAULT_GATE_GARAGE_PORT}`;
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling (401 handling)
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - clear it
          await StorageService.clearToken();
          // Trigger logout event that App.tsx can listen to
          if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            try {
              window.dispatchEvent(new CustomEvent('token-expired'));
            } catch (e) {
              // CustomEvent might not be available in React Native
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setBaseURL(ipAddress: string, port?: string) {
    const portPart = port ? `:${port}` : '';
    this.baseURL = `http://${ipAddress}${portPart}`;
    this.axiosInstance.defaults.baseURL = this.baseURL;
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.axiosInstance.post<LoginResponse>(
        API_ENDPOINTS.LOGIN,
        { username, password }
      );
      
      if (response.data.token) {
        await StorageService.saveToken(response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('[ApiService] ==========================================');
      console.error('[ApiService] Login FAILED!');
      console.error('[ApiService] Base URL:', this.baseURL);
      console.error('[ApiService] Full URL:', `${this.baseURL}${API_ENDPOINTS.LOGIN}`);
      if (axios.isAxiosError(error)) {
        console.error('[ApiService] Error details:', {
          message: error.message,
          code: error.code,
          response: error.response?.status,
          responseData: error.response?.data,
          requestURL: error.config?.url,
          requestBaseURL: error.config?.baseURL,
        });
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
          console.error('[ApiService] Network error - cannot reach ESP32 at:', this.baseURL);
          console.error('[ApiService] Check if ESP32 is running and accessible on this IP');
        }
      }
      console.error('[ApiService] ==========================================');
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await StorageService.clearToken();
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      // Change password requires authentication
      await this.requireAuthForESP32();
      const token = await this.getAuthToken();
      
      await this.axiosInstance.post(API_ENDPOINTS.CHANGE_PASSWORD, {
        oldPassword,
        newPassword,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error: any) {
      if (error.message === 'AUTH_REQUIRED') {
        throw error; // Pass through for lazy auth
      }
      throw this.handleError(error);
    }
  }

  async triggerGate(gateType: GateType): Promise<GateActionResponse> {
    try {
      // Handle Sonoff blinds (living room) - NO AUTH REQUIRED
      if (gateType === GateType.LIVING_ROOM_FIX || gateType === GateType.LIVING_ROOM_TERRACE) {
        return await this.triggerBlinds(gateType);
      }

      // ESP32 gates - AUTH REQUIRED
      await this.requireAuthForESP32();
      const token = await this.getAuthToken();

      let endpoint: string;
      let gateName: string;
      
      if (gateType === GateType.ENTRANCE) {
        endpoint = API_ENDPOINTS.GATE_ENTRANCE_TRIGGER;
        gateName = 'Brama Wjazdowa';
      } else {
        endpoint = API_ENDPOINTS.GATE_GARAGE_TRIGGER;
        gateName = 'Brama Garażowa';
      }

      console.log('[ApiService] Trigger gate:', gateName);
      console.log('[ApiService] Base URL:', this.baseURL);
      console.log('[ApiService] Endpoint:', endpoint);
      console.log('[ApiService] Full URL:', `${this.baseURL}${endpoint}`);

      const response = await this.axiosInstance.post<GateActionResponse>(endpoint, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Record activity
      await ActivityService.recordActivity(
        `gate-${gateType}`,
        gateName,
        'gate',
        'triggered'
      ).catch(err => console.error('[ApiService] Failed to record activity:', err));
      
      return response.data;
    } catch (error: any) {
      if (error.message === 'AUTH_REQUIRED') {
        throw error; // Pass through for lazy auth
      }
      throw this.handleError(error);
    }
  }

  private async triggerBlinds(gateType: GateType): Promise<GateActionResponse> {
    try {
      const tasmotaService = this.getTasmotaService(gateType);
      const gateName = this.getBlindsName(gateType);
      
      // Trigger blinds (toggle: if currently up, go down; if down, go up)
      // For simplicity, we'll use OPEN action as trigger
      await tasmotaService.blindsOpen();
      
      // Record activity
      await ActivityService.recordActivity(
        `gate-${gateType}`,
        gateName,
        'blinds',
        'triggered'
      ).catch(err => console.error('[ApiService] Failed to record activity:', err));
      
      return {
        success: true,
        gate: gateType,
        action: 'triggered',
        state: 'opening',
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Tasmota service for a gate type
   */
  private getTasmotaService(gateType: GateType): TasmotaApiService {
    if (gateType === GateType.LIVING_ROOM_FIX) {
      return new TasmotaApiService(
        DEFAULT_BLINDS_LIVING_ROOM_FIX_IP,
        1 // Shutter1
      );
    } else {
      return new TasmotaApiService(
        DEFAULT_BLINDS_LIVING_ROOM_TERRACE_IP,
        1 // Shutter1 (or 2 if you have multiple shutters on one device)
      );
    }
  }

  private getBlindsName(gateType: GateType): string {
    switch (gateType) {
      case GateType.LIVING_ROOM_FIX:
        return 'Roleta salon (fix)';
      case GateType.LIVING_ROOM_TERRACE:
        return 'Roleta salon (taras)';
      default:
        return 'Roleta';
    }
  }

  /**
   * Check if authentication is required for ESP32 operations
   * Throws AUTH_REQUIRED error if token is missing or invalid
   */
  private async requireAuthForESP32(): Promise<void> {
    const token = await StorageService.getToken();
    if (!token || !StorageService.isTokenValid(token)) {
      throw new Error('AUTH_REQUIRED');
    }
  }

  /**
   * Get auth token for ESP32 requests
   */
  private async getAuthToken(): Promise<string> {
    const token = await StorageService.getToken();
    if (!token || !StorageService.isTokenValid(token)) {
      throw new Error('AUTH_REQUIRED');
    }
    return token;
  }

  async openGate(gateType: GateType): Promise<GateActionResponse> {
    try {
      // Handle Sonoff blinds (living room) - NO AUTH REQUIRED
      if (gateType === GateType.LIVING_ROOM_FIX || gateType === GateType.LIVING_ROOM_TERRACE) {
        return await this.openBlinds(gateType);
      }

      // ESP32 gates - AUTH REQUIRED
      await this.requireAuthForESP32();
      const token = await this.getAuthToken();

      const endpoint =
        gateType === GateType.ENTRANCE
          ? API_ENDPOINTS.GATE_ENTRANCE_OPEN
          : API_ENDPOINTS.GATE_GARAGE_OPEN;

      const gateName = gateType === GateType.ENTRANCE ? 'Brama Wjazdowa' : 'Brama Garażowa';
      
      const response = await this.axiosInstance.post<GateActionResponse>(endpoint, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Record activity
      await ActivityService.recordActivity(
        `gate-${gateType}`,
        gateName,
        'gate',
        'opened'
      ).catch(err => console.error('[ApiService] Failed to record activity:', err));
      
      return response.data;
    } catch (error: any) {
      if (error.message === 'AUTH_REQUIRED') {
        throw error; // Pass through for lazy auth
      }
      throw this.handleError(error);
    }
  }

  private async openBlinds(gateType: GateType): Promise<GateActionResponse> {
    try {
      const tasmotaService = this.getTasmotaService(gateType);
      const gateName = this.getBlindsName(gateType);
      
      // Use ShutterOpen command (moves to 0% - fully open)
      await tasmotaService.blindsOpen();
      
      // Record activity
      await ActivityService.recordActivity(
        `gate-${gateType}`,
        gateName,
        'blinds',
        'opened'
      ).catch(err => console.error('[ApiService] Failed to record activity:', err));
      
      return {
        success: true,
        gate: gateType,
        action: 'opened',
        state: 'opening',
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async closeGate(gateType: GateType): Promise<GateActionResponse> {
    try {
      // Handle Sonoff blinds (living room) - NO AUTH REQUIRED
      if (gateType === GateType.LIVING_ROOM_FIX || gateType === GateType.LIVING_ROOM_TERRACE) {
        return await this.closeBlinds(gateType);
      }

      // ESP32 gates - AUTH REQUIRED
      await this.requireAuthForESP32();
      const token = await this.getAuthToken();

      const endpoint =
        gateType === GateType.ENTRANCE
          ? API_ENDPOINTS.GATE_ENTRANCE_CLOSE
          : API_ENDPOINTS.GATE_GARAGE_CLOSE;

      const gateName = gateType === GateType.ENTRANCE ? 'Brama Wjazdowa' : 'Brama Garażowa';
      
      const response = await this.axiosInstance.post<GateActionResponse>(endpoint, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Record activity
      await ActivityService.recordActivity(
        `gate-${gateType}`,
        gateName,
        'gate',
        'closed'
      ).catch(err => console.error('[ApiService] Failed to record activity:', err));
      
      return response.data;
    } catch (error: any) {
      if (error.message === 'AUTH_REQUIRED') {
        throw error; // Pass through for lazy auth
      }
      throw this.handleError(error);
    }
  }

  private async closeBlinds(gateType: GateType): Promise<GateActionResponse> {
    try {
      const tasmotaService = this.getTasmotaService(gateType);
      const gateName = this.getBlindsName(gateType);
      
      // Use ShutterClose command (moves to 100% - fully closed)
      await tasmotaService.blindsClose();
      
      // Record activity
      await ActivityService.recordActivity(
        `gate-${gateType}`,
        gateName,
        'blinds',
        'closed'
      ).catch(err => console.error('[ApiService] Failed to record activity:', err));
      
      return {
        success: true,
        gate: gateType,
        action: 'closed',
        state: 'closing',
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async stopBlinds(gateType: GateType): Promise<GateActionResponse> {
    try {
      if (gateType !== GateType.LIVING_ROOM_FIX && gateType !== GateType.LIVING_ROOM_TERRACE) {
        throw new Error('Metoda dostępna tylko dla rolet salonu');
      }

      const tasmotaService = this.getTasmotaService(gateType);
      const gateName = this.getBlindsName(gateType);
      
      await tasmotaService.blindsStop();
      
      // Record activity
      await ActivityService.recordActivity(
        `gate-${gateType}`,
        gateName,
        'blinds',
        'stopped'
      ).catch(err => console.error('[ApiService] Failed to record activity:', err));
      
      return {
        success: true,
        gate: gateType,
        action: 'stopped',
        state: 'stopped',
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async setBlindsPosition(gateType: GateType, percentage: number): Promise<GateActionResponse> {
    console.log('[ApiService] setBlindsPosition START:', { gateType, percentage });
    try {
      if (gateType !== GateType.LIVING_ROOM_FIX && gateType !== GateType.LIVING_ROOM_TERRACE) {
        throw new Error('Metoda dostępna tylko dla rolet salonu');
      }

      const tasmotaService = this.getTasmotaService(gateType);
      const gateName = this.getBlindsName(gateType);
      
      console.log('[ApiService] setBlindsPosition calling tasmotaService.setBlindsPosition:', { percentage });
      await tasmotaService.setBlindsPosition(percentage);
      console.log('[ApiService] setBlindsPosition tasmotaService.setBlindsPosition completed');
      
      // Record activity
      await ActivityService.recordActivity(
        `gate-${gateType}`,
        gateName,
        'blinds',
        `position-${percentage}%`
      ).catch(err => console.error('[ApiService] Failed to record activity:', err));
      
      return {
        success: true,
        gate: gateType,
        action: 'position_set',
        state: 'moving',
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBlindsPosition(gateType: GateType): Promise<number> {
    try {
      if (gateType !== GateType.LIVING_ROOM_FIX && gateType !== GateType.LIVING_ROOM_TERRACE) {
        throw new Error('Metoda dostępna tylko dla rolet salonu');
      }

      const tasmotaService = this.getTasmotaService(gateType);
      return await tasmotaService.getBlindsPosition();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBlindsStatus(gateType: GateType): Promise<{ position: number; direction: number }> {
    try {
      if (gateType !== GateType.LIVING_ROOM_FIX && gateType !== GateType.LIVING_ROOM_TERRACE) {
        throw new Error('Metoda dostępna tylko dla rolet salonu');
      }

      const tasmotaService = this.getTasmotaService(gateType);
      return await tasmotaService.getBlindsStatus();
    } catch (error) {
      throw this.handleError(error);
    }
  }


  async checkHealth(): Promise<any> {
    try {
      console.log('[ApiService] Health check - Base URL:', this.baseURL);
      console.log('[ApiService] Health check - Full URL:', `${this.baseURL}${API_ENDPOINTS.HEALTH}`);
      const response = await this.axiosInstance.get(API_ENDPOINTS.HEALTH, {
        timeout: 3000,
      });
      console.log('[ApiService] Health check - Success:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ApiService] Health check failed:', error);
      if (axios.isAxiosError(error)) {
        console.error('[ApiService] Health check error details:', {
          message: error.message,
          code: error.code,
          response: error.response?.status,
          responseData: error.response?.data,
          requestURL: error.config?.url,
          requestBaseURL: error.config?.baseURL,
        });
      }
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      
      if (axiosError.response) {
        // Server responded with error
        const message = axiosError.response.data?.error || 'Server error';
        return new Error(message);
      } else if (axiosError.request) {
        // Request was made but no response
        return new Error('No response from server. Check your connection.');
      }
    }
    
    return new Error('An unexpected error occurred');
  }
}

export default new ApiService();


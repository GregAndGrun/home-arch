import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  API_ENDPOINTS,
  API_TIMEOUT,
  DEFAULT_GATE_ENTRANCE_IP,
  DEFAULT_GATE_GARAGE_IP,
  DEFAULT_GATE_ENTRANCE_PORT,
  DEFAULT_GATE_GARAGE_PORT,
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

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await StorageService.getToken();
        if (token) {
          // Check if token is still valid before sending request
          if (!StorageService.isTokenValid(token)) {
            // Token expired, clear it
            await StorageService.clearToken();
            // Reject the request to trigger logout
            return Promise.reject(new Error('Token expired'));
          }
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401 || error.message === 'Token expired') {
          // Token expired or invalid - logout
          await StorageService.clearToken();
          // Trigger logout event that App.tsx can listen to
          if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            try {
              window.dispatchEvent(new CustomEvent('token-expired'));
            } catch (e) {
              // CustomEvent might not be available in React Native
              console.warn('Could not dispatch token-expired event:', e);
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
    console.log('[ApiService] Base URL updated to:', this.baseURL);
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      console.log('[ApiService] ==========================================');
      console.log('[ApiService] Attempting login to:', this.baseURL);
      console.log('[ApiService] Endpoint:', API_ENDPOINTS.LOGIN);
      console.log('[ApiService] Full URL:', `${this.baseURL}${API_ENDPOINTS.LOGIN}`);
      console.log('[ApiService] Username:', username);
      console.log('[ApiService] ==========================================');
      
      const response = await this.axiosInstance.post<LoginResponse>(
        API_ENDPOINTS.LOGIN,
        { username, password }
      );
      
      console.log('[ApiService] Login successful! Status:', response.status);
      console.log('[ApiService] Response data:', response.data);
      
      if (response.data.token) {
        await StorageService.saveToken(response.data.token);
        console.log('[ApiService] Token saved successfully');
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

  async triggerGate(gateType: GateType): Promise<GateActionResponse> {
    try {
      let endpoint: string;
      let gateName: string;
      
      if (gateType === GateType.ENTRANCE) {
        endpoint = API_ENDPOINTS.GATE_ENTRANCE_TRIGGER;
        gateName = 'Brama Wjazdowa';
      } else if (gateType === GateType.TERRACE_FIX) {
        endpoint = API_ENDPOINTS.GATE_GARAGE_TRIGGER;
        gateName = 'Roleta taras (fix)';
      } else if (gateType === GateType.TERRACE_DOOR) {
        endpoint = API_ENDPOINTS.GATE_GARAGE_TRIGGER;
        gateName = 'Roleta taras (drzwi)';
      } else {
        endpoint = API_ENDPOINTS.GATE_GARAGE_TRIGGER;
        gateName = 'Brama Garażowa';
      }

      const response = await this.axiosInstance.post<GateActionResponse>(endpoint);
      
      // Record activity
      await ActivityService.recordActivity(
        `gate-${gateType}`,
        gateName,
        'gate',
        'triggered'
      ).catch(err => console.error('[ApiService] Failed to record activity:', err));
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async openGate(gateType: GateType): Promise<GateActionResponse> {
    try {
      const endpoint =
        gateType === GateType.ENTRANCE
          ? API_ENDPOINTS.GATE_ENTRANCE_OPEN
          : API_ENDPOINTS.GATE_GARAGE_OPEN;

      const gateName = gateType === GateType.ENTRANCE ? 'Brama Wjazdowa' : 'Brama Garażowa';
      
      const response = await this.axiosInstance.post<GateActionResponse>(endpoint);
      
      // Record activity
      await ActivityService.recordActivity(
        `gate-${gateType}`,
        gateName,
        'gate',
        'opened'
      ).catch(err => console.error('[ApiService] Failed to record activity:', err));
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async closeGate(gateType: GateType): Promise<GateActionResponse> {
    try {
      const endpoint =
        gateType === GateType.ENTRANCE
          ? API_ENDPOINTS.GATE_ENTRANCE_CLOSE
          : API_ENDPOINTS.GATE_GARAGE_CLOSE;

      const gateName = gateType === GateType.ENTRANCE ? 'Brama Wjazdowa' : 'Brama Garażowa';
      
      const response = await this.axiosInstance.post<GateActionResponse>(endpoint);
      
      // Record activity
      await ActivityService.recordActivity(
        `gate-${gateType}`,
        gateName,
        'gate',
        'closed'
      ).catch(err => console.error('[ApiService] Failed to record activity:', err));
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async checkHealth(): Promise<any> {
    try {
      console.log('[ApiService] Checking health at:', this.baseURL);
      // Use shorter timeout for health check to avoid blocking app startup
      const response = await this.axiosInstance.get(API_ENDPOINTS.HEALTH, {
        timeout: 3000, // 3 seconds instead of default 10 seconds
      });
      console.log('[ApiService] Health check successful:', response.status);
      return response.data;
    } catch (error) {
      console.error('[ApiService] Health check failed:', error);
      if (axios.isAxiosError(error)) {
        console.error('[ApiService] Error details:', {
          message: error.message,
          code: error.code,
          response: error.response?.status,
          baseURL: this.baseURL,
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


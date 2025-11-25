import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  API_ENDPOINTS,
  API_TIMEOUT,
  DEFAULT_GATE_ENTRANCE_IP,
  DEFAULT_GATE_GARAGE_IP,
} from '../config/api.config';
import {
  LoginRequest,
  LoginResponse,
  GatesStatusResponse,
  GateActionResponse,
  ApiError,
  GateType,
} from '../types';
import { StorageService } from './StorageService';

class ApiService {
  private axiosInstance: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use garage gate IP as default (since it's the main/only gate currently installed)
    this.baseURL = `http://${DEFAULT_GATE_GARAGE_IP}`;
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

  setBaseURL(ipAddress: string) {
    this.baseURL = `http://${ipAddress}`;
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

  async getGatesStatus(): Promise<GatesStatusResponse> {
    try {
      const response = await this.axiosInstance.get<GatesStatusResponse>(
        API_ENDPOINTS.GATES_STATUS
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async triggerGate(gateType: GateType): Promise<GateActionResponse> {
    try {
      const endpoint =
        gateType === GateType.ENTRANCE
          ? API_ENDPOINTS.GATE_ENTRANCE_TRIGGER
          : API_ENDPOINTS.GATE_GARAGE_TRIGGER;

      const response = await this.axiosInstance.post<GateActionResponse>(endpoint);
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

      const response = await this.axiosInstance.post<GateActionResponse>(endpoint);
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

      const response = await this.axiosInstance.post<GateActionResponse>(endpoint);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async checkHealth(): Promise<any> {
    try {
      const response = await this.axiosInstance.get(API_ENDPOINTS.HEALTH);
      return response.data;
    } catch (error) {
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


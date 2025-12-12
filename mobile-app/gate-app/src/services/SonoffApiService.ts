import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_TIMEOUT } from '../config/api.config';

interface SonoffSwitchRequest {
  deviceid: string;
  data: {
    switch?: 'on' | 'off';
    switches?: Array<{
      outlet: number;
      switch: 'on' | 'off';
    }>;
  };
}

interface SonoffResponse {
  error: number;
  reason?: string;
  seq?: number;
  data?: any;
}

interface SonoffInfoResponse extends SonoffResponse {
  data?: {
    switches?: Array<{ outlet: number; switch: 'on' | 'off' }>;
    motor?: number; // Position percentage (0-100) if available
    position?: number; // Position percentage (0-100) if available
  };
}

class SonoffApiService {
  private axiosInstance: AxiosInstance;
  private baseURL: string;
  private deviceId: string;

  constructor(ipAddress: string, deviceId: string = '1000abcdef0') {
    // Sonoff DIY mode uses port 8081
    this.baseURL = `http://${ipAddress}:8081`;
    this.deviceId = deviceId;
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Control a single switch (channel) on Sonoff Dual R3
   * @param outlet Channel number (0 or 1)
   * @param state 'on' or 'off'
   */
  async setSwitch(outlet: number, state: 'on' | 'off'): Promise<void> {
    try {
      const request: SonoffSwitchRequest = {
        deviceid: this.deviceId,
        data: {
          switches: [
            { outlet, switch: state },
          ],
        },
      };

      const response = await this.axiosInstance.post<SonoffResponse>(
        '/zeroconf/switches',
        request
      );

      if (response.data.error !== 0) {
        throw new Error(response.data.reason || 'Sonoff API error');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<SonoffResponse>;
        console.error('[SonoffApiService] Error details:', {
          code: axiosError.code,
          message: axiosError.message,
          response: axiosError.response?.data,
          status: axiosError.response?.status,
        });
        if (axiosError.response?.data?.reason) {
          throw new Error(axiosError.response.data.reason);
        }
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND' || axiosError.code === 'ETIMEDOUT') {
          throw new Error('Nie można połączyć się z urządzeniem Sonoff. Sprawdź IP i połączenie sieciowe.');
        }
      }
      console.error('[SonoffApiService] Unknown error:', error);
      throw new Error('Błąd komunikacji z urządzeniem Sonoff');
    }
  }

  /**
   * Control both switches simultaneously
   * @param switches Array of {outlet, switch} pairs
   */
  async setSwitches(switches: Array<{ outlet: number; switch: 'on' | 'off' }>): Promise<void> {
    try {
      const request: SonoffSwitchRequest = {
        deviceid: this.deviceId,
        data: {
          switches,
        },
      };

      const response = await this.axiosInstance.post<SonoffResponse>(
        '/zeroconf/switches',
        request
      );

      if (response.data.error !== 0) {
        throw new Error(response.data.reason || 'Sonoff API error');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<SonoffResponse>;
        console.error('[SonoffApiService] Error details:', {
          code: axiosError.code,
          message: axiosError.message,
          response: axiosError.response?.data,
          status: axiosError.response?.status,
        });
        if (axiosError.response?.data?.reason) {
          throw new Error(axiosError.response.data.reason);
        }
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND' || axiosError.code === 'ETIMEDOUT') {
          throw new Error('Nie można połączyć się z urządzeniem Sonoff. Sprawdź IP i połączenie sieciowe.');
        }
      }
      console.error('[SonoffApiService] Unknown error:', error);
      throw new Error('Błąd komunikacji z urządzeniem Sonoff');
    }
  }

  /**
   * Get current switch states
   */
  async getSwitches(): Promise<Array<{ outlet: number; switch: 'on' | 'off' }>> {
    try {
      const response = await this.axiosInstance.post<SonoffResponse & { 
        data?: { switches?: Array<{ outlet: number; switch: 'on' | 'off' }> } 
      }>(
        '/zeroconf/info',
        { deviceid: this.deviceId }
      );

      if (response.data.error !== 0) {
        throw new Error(response.data.reason || 'Sonoff API error');
      }

      // Extract switches from response
      const switches = (response.data as any).data?.switches || [];
      return switches;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<SonoffResponse>;
        if (axiosError.response?.data?.reason) {
          throw new Error(axiosError.response.data.reason);
        }
      }
      throw new Error('Nie można pobrać stanu urządzenia Sonoff');
    }
  }

  /**
   * Control blinds: UP (channel 0 on, channel 1 off)
   */
  async blindsUp(): Promise<void> {
    await this.setSwitches([
      { outlet: 0, switch: 'on' },
      { outlet: 1, switch: 'off' },
    ]);
  }

  /**
   * Control blinds: DOWN (channel 0 off, channel 1 on)
   */
  async blindsDown(): Promise<void> {
    await this.setSwitches([
      { outlet: 0, switch: 'off' },
      { outlet: 1, switch: 'on' },
    ]);
  }

  /**
   * Stop blinds (both channels off)
   */
  async blindsStop(): Promise<void> {
    await this.setSwitches([
      { outlet: 0, switch: 'off' },
      { outlet: 1, switch: 'off' },
    ]);
  }

  /**
   * Get current blinds position (percentage 0-100)
   * Note: This requires Motor Mode calibration in eWeLink first
   */
  async getBlindsPosition(): Promise<number> {
    try {
      const response = await this.axiosInstance.post<SonoffInfoResponse>(
        '/zeroconf/info',
        { deviceid: this.deviceId }
      );

      if (response.data.error !== 0) {
        throw new Error(response.data.reason || 'Sonoff API error');
      }

      // Try to get position from response
      const position = response.data.data?.motor || response.data.data?.position;
      if (typeof position === 'number') {
        return Math.max(0, Math.min(100, position));
      }

      // If position not available, return unknown (-1)
      return -1;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<SonoffResponse>;
        if (axiosError.response?.data?.reason) {
          throw new Error(axiosError.response.data.reason);
        }
      }
      throw new Error('Nie można pobrać pozycji rolet');
    }
  }

  /**
   * Set blinds position to specific percentage (0-100)
   * Note: This requires Motor Mode calibration in eWeLink first
   * Implementation: Uses motor-reverse endpoint if available, otherwise simulates
   */
  async setBlindsPosition(percentage: number): Promise<void> {
    try {
      const clampedPercentage = Math.max(0, Math.min(100, percentage));
      
      // Try to use motor-reverse endpoint if available
      try {
        const request = {
          deviceid: this.deviceId,
          data: {
            motor: clampedPercentage,
          },
        };

        const response = await this.axiosInstance.post<SonoffResponse>(
          '/zeroconf/motor-reverse',
          request
        );

        if (response.data.error === 0) {
          return; // Success
        }
      } catch (e) {
        // motor-reverse endpoint might not be available, fall back to simulation
      }

      // Fallback: Get current position and simulate movement
      const currentPosition = await this.getBlindsPosition();
      
      if (currentPosition === -1) {
        // Position unknown, use simple up/down based on percentage
        if (clampedPercentage > 50) {
          await this.blindsUp();
        } else {
          await this.blindsDown();
        }
        // Note: In real implementation, you'd need to track time and stop at right position
        // This is a simplified version
        return;
      }

      // Calculate direction and move
      if (clampedPercentage > currentPosition) {
        await this.blindsUp();
      } else if (clampedPercentage < currentPosition) {
        await this.blindsDown();
      } else {
        await this.blindsStop();
      }

      // Note: In production, you'd need to:
      // 1. Calculate movement time based on percentage difference
      // 2. Start movement
      // 3. Stop after calculated time
      // This requires calibration data (time for full open/close)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<SonoffResponse>;
        if (axiosError.response?.data?.reason) {
          throw new Error(axiosError.response.data.reason);
        }
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND' || axiosError.code === 'ETIMEDOUT') {
          throw new Error('Nie można połączyć się z urządzeniem Sonoff. Sprawdź IP i połączenie sieciowe.');
        }
      }
      throw new Error('Nie można ustawić pozycji rolet');
    }
  }
}

export default SonoffApiService;


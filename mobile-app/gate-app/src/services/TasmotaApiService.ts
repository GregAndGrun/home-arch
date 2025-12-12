import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_TIMEOUT } from '../config/api.config';

interface TasmotaStatusResponse {
  StatusSNS?: {
    Time?: string;
    Shutter1?: {
      Position?: number; // 0-100
      Direction?: number; // -1 = closing, 0 = stopped, 1 = opening
      Target?: number;
      Tilt?: number;
    };
    Shutter2?: {
      Position?: number;
      Direction?: number;
      Target?: number;
      Tilt?: number;
    };
  };
  StatusSTS?: {
    POWER1?: string | number; // "ON" | "OFF" | 1 | 0
    POWER2?: string | number; // "ON" | "OFF" | 1 | 0
    Shutter1?: {
      Position?: number;
      Direction?: number;
      Target?: number;
      Tilt?: number;
    };
    Shutter2?: {
      Position?: number;
      Direction?: number;
      Target?: number;
      Tilt?: number;
    };
  };
  Status?: {
    POWER1?: string | number;
    POWER2?: string | number;
    Shutter1?: {
      Position?: number;
      Direction?: number;
      Target?: number;
      Tilt?: number;
    };
    Shutter2?: {
      Position?: number;
      Direction?: number;
      Target?: number;
      Tilt?: number;
    };
  };
  // Direct response format (when command returns Shutter directly)
  Shutter1?: {
    Position?: number;
    Direction?: number;
    Target?: number;
    Tilt?: number;
  };
  Shutter2?: {
    Position?: number;
    Direction?: number;
    Target?: number;
    Tilt?: number;
  };
  // Direct power status
  POWER1?: string | number;
  POWER2?: string | number;
}

interface TasmotaCommandResponse {
  Command?: string;
}

class TasmotaApiService {
  private axiosInstance: AxiosInstance;
  private baseURL: string;
  private shutterNumber: number; // 1 or 2 for Shutter1 or Shutter2

  constructor(ipAddress: string, shutterNumber: number = 1) {
    // Tasmota uses HTTP on port 80 by default
    this.baseURL = `http://${ipAddress}`;
    this.shutterNumber = shutterNumber;
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Map app position to Tasmota position (non-linear mapping)
   * Blinds move faster at the beginning and slower at the end
   * This compensates for the non-linear speed of the blinds
   * 
   * Examples with exponent 1.6:
   * - 50% app → ~32% Tasmota (blinds move faster initially)
   * - 90% app → ~78% Tasmota (blinds move slower at the end)
   * 
   * @param appPosition Position in app (0-100, where 0 = open, 100 = closed)
   * @returns Position in Tasmota (0-100, where 0 = closed, 100 = open - inverted)
   */
  private mapAppToTasmotaPosition(appPosition: number): number {
    // Clamp to valid range
    const clamped = Math.max(0, Math.min(100, appPosition));
    
    // Non-linear mapping: compress the beginning, stretch the end
    // Using a power function to create the curve
    // Lower values (0-50%) map to smaller Tasmota values
    // Higher values (50-100%) map to larger Tasmota values
    
    // Normalize to 0-1 range
    const normalized = clamped / 100;
    
    // Apply non-linear transformation
    // Using a curve that compresses the beginning and stretches the end
    // Formula: y = x^1.6 (increased exponent for stronger compression)
    const mapped = Math.pow(normalized, 1.6);
    
    // Convert back to 0-100 range
    return Math.round(mapped * 100);
  }

  /**
   * Map Tasmota position to app position (inverse of mapAppToTasmotaPosition)
   * 
   * @param tasmotaPosition Position in Tasmota (0-100, where 0 = closed, 100 = open - inverted)
   * @returns Position in app (0-100, where 0 = open, 100 = closed)
   */
  private mapTasmotaToAppPosition(tasmotaPosition: number): number {
    // Clamp to valid range
    const clamped = Math.max(0, Math.min(100, tasmotaPosition));
    
    // Normalize to 0-1 range
    const normalized = clamped / 100;
    
    // Apply inverse transformation: y = x^(1/1.6)
    const mapped = Math.pow(normalized, 1 / 1.6);
    
    // Convert back to 0-100 range
    return Math.round(mapped * 100);
  }

  /**
   * Send command to Tasmota device
   * @param command Tasmota command (e.g., "ShutterOpen", "ShutterPosition 50")
   */
  private async sendCommand(command: string): Promise<void> {
    try {
      const encodedCommand = encodeURIComponent(command);
      const url = `/cm?cmnd=${encodedCommand}`;
      const fullURL = `${this.baseURL}${url}`;
      
      console.log('========================================');
      console.log('[TasmotaApiService] sendCommand - FULL REQUEST DETAILS:');
      console.log('  Command (raw):', command);
      console.log('  Command (encoded):', encodedCommand);
      console.log('  URL path:', url);
      console.log('  Base URL:', this.baseURL);
      console.log('  FULL URL:', fullURL);
      console.log('  HTTP Method: GET');
      console.log('========================================');
      
      const response = await this.axiosInstance.get<TasmotaCommandResponse>(url);

      console.log('========================================');
      console.log('[TasmotaApiService] sendCommand - RESPONSE:');
      console.log('  Status:', response.status);
      console.log('  Status Text:', response.statusText);
      console.log('  Response Data:', JSON.stringify(response.data, null, 2));
      console.log('  Response Headers:', response.headers);
      console.log('========================================');

      // Tasmota returns command echo, check if it was successful
      if (response.data.Command && response.data.Command.includes('Error')) {
        throw new Error(`Tasmota command failed: ${command}`);
      }
    } catch (error) {
      console.error('========================================');
      console.error('[TasmotaApiService] sendCommand - ERROR:');
      console.error('  Error:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('  Error Code:', axiosError.code);
        console.error('  Error Message:', axiosError.message);
        console.error('  Request URL:', axiosError.config?.url);
        console.error('  Request Base URL:', axiosError.config?.baseURL);
        console.error('  Request Method:', axiosError.config?.method);
        console.error('  Response Status:', axiosError.response?.status);
        console.error('  Response Data:', axiosError.response?.data);
      }
      console.error('========================================');
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND' || axiosError.code === 'ETIMEDOUT') {
          throw new Error('Nie można połączyć się z urządzeniem Tasmota. Sprawdź IP i połączenie sieciowe.');
        }
      }
      throw new Error(`Błąd komunikacji z urządzeniem Tasmota: ${error}`);
    }
  }

  /**
   * Get device status
   * Uses Status 11 (StatusSTS) which returns Shutter information directly
   */
  async getStatus(): Promise<TasmotaStatusResponse> {
    try {
      // Use Status 11 (StatusSTS) which includes Shutter information
      const response = await this.axiosInstance.get<TasmotaStatusResponse>('/cm?cmnd=Status%2011');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<TasmotaStatusResponse>;
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND' || axiosError.code === 'ETIMEDOUT') {
          throw new Error('Nie można połączyć się z urządzeniem Tasmota. Sprawdź IP i połączenie sieciowe.');
        }
      }
      throw new Error('Nie można pobrać stanu urządzenia Tasmota');
    }
  }

  /**
   * Get Shutter status directly (returns Shutter1/Shutter2 object)
   * Uses Status 10 (StatusSNS) which includes Shutter information
   */
  private async getShutterStatus(): Promise<TasmotaStatusResponse> {
    try {
      // Use Status 10 (StatusSNS) which includes Shutter1/Shutter2 information
      const response = await this.axiosInstance.get<TasmotaStatusResponse>('/cm?cmnd=Status%2010');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<TasmotaStatusResponse>;
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND' || axiosError.code === 'ETIMEDOUT') {
          throw new Error('Nie można połączyć się z urządzeniem Tasmota. Sprawdź IP i połączenie sieciowe.');
        }
      }
      throw new Error('Nie można pobrać stanu rolet Tasmota');
    }
  }

  /**
   * Control blinds: OPEN
   * Uses Shutter mode commands (ShutterOpen1) - Tasmota handles position tracking automatically
   */
  async blindsOpen(): Promise<void> {
    await this.sendCommand(`ShutterOpen${this.shutterNumber}`);
  }

  /**
   * Control blinds: CLOSE
   * Uses Shutter mode commands (ShutterClose1) - Tasmota handles position tracking automatically
   */
  async blindsClose(): Promise<void> {
    await this.sendCommand(`ShutterClose${this.shutterNumber}`);
  }

  /**
   * Stop blinds
   * Uses Shutter mode commands (ShutterStop1)
   */
  async blindsStop(): Promise<void> {
    await this.sendCommand(`ShutterStop${this.shutterNumber}`);
  }

  /**
   * Get current blinds position and direction
   * Uses Shutter mode status from Tasmota (Status 10 - StatusSNS)
   * @returns Object with position (0-100) and direction (-1 = closing, 0 = stopped, 1 = opening)
   */
  async getBlindsStatus(): Promise<{ position: number; direction: number }> {
    try {
      // Get position from Shutter mode (Status 10 - StatusSNS)
      const shutterStatus = await this.getShutterStatus();
      const shutter = this.shutterNumber === 1 
        ? (shutterStatus.StatusSNS?.Shutter1 || shutterStatus.StatusSTS?.Shutter1 || shutterStatus.Status?.Shutter1 || shutterStatus.Shutter1)
        : (shutterStatus.StatusSNS?.Shutter2 || shutterStatus.StatusSTS?.Shutter2 || shutterStatus.Status?.Shutter2 || shutterStatus.Shutter2);
      
      if (shutter?.Position !== undefined && shutter?.Direction !== undefined) {
        // Tasmota position: 0% = closed, 100% = open (inverted from app)
        const tasmotaPosition = Math.max(0, Math.min(100, shutter.Position));
        
        // Tasmota uses: 0% = closed, 100% = open
        // App uses: 0% = open, 100% = closed
        // So we need to invert: App position = 100 - Tasmota position
        // Example: Tasmota 25% (25% open = 75% closed) → App 75% (75% closed)
        //          Tasmota 75% (75% open = 25% closed) → App 25% (25% closed)
        const appPosition = 100 - tasmotaPosition;
        
        // Clamp to valid range to prevent UI jumping
        const finalPosition = Math.max(0, Math.min(100, appPosition));
        
        // Direction: Tasmota 1 = opening (moving towards 100%), -1 = closing (moving towards 0%)
        // App: 1 = opening (moving towards 0%), -1 = closing (moving towards 100%)
        // Since position is inverted, direction should also be inverted
        const appDirection = shutter.Direction === 1 ? -1 : shutter.Direction === -1 ? 1 : 0;
        
        console.log('[TasmotaApiService] getBlindsStatus:', {
          tasmotaPosition,
          appPosition,
          finalPosition,
          tasmotaDirection: shutter.Direction,
          appDirection,
        });
        
        return {
          position: finalPosition,
          direction: appDirection,
        };
      }
      
      // If Shutter mode doesn't provide position, return unknown
      return { position: -1, direction: 0 };
    } catch (error) {
      console.error('[TasmotaApiService] Failed to get blinds status:', error);
      return { position: -1, direction: 0 };
    }
  }

  /**
   * Get current blinds position (percentage 0-100)
   */
  async getBlindsPosition(): Promise<number> {
    const status = await this.getBlindsStatus();
    return status.position;
  }

  /**
   * Set blinds position to specific percentage (0-100)
   * Uses Shutter mode Position command - Tasmota handles timing and position tracking automatically
   * Applies non-linear mapping to compensate for speed differences
   * @param percentage Position percentage (0 = fully open, 100 = fully closed)
   */
  async setBlindsPosition(percentage: number): Promise<void> {
    console.log('[TasmotaApiService] setBlindsPosition START:', { percentage });
    
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    console.log('[TasmotaApiService] setBlindsPosition clamped:', { clampedPercentage });
    
    // Invert for Tasmota: App 0% = open, 100% = closed → Tasmota 0% = closed, 100% = open
    // Example: App 0% (open) → Tasmota 100% (open)
    //          App 25% (25% closed) → Tasmota 75% (75% open)
    //          App 50% (half closed) → Tasmota 50% (half open)
    //          App 75% (75% closed) → Tasmota 25% (25% open)
    //          App 100% (closed) → Tasmota 0% (closed)
    const tasmotaPercentage = 100 - clampedPercentage;
    console.log('[TasmotaApiService] setBlindsPosition inverted:', { tasmotaPercentage });
    
    const command = `ShutterPosition${this.shutterNumber} ${tasmotaPercentage}`;
    console.log('[TasmotaApiService] setBlindsPosition command:', { 
      appPercentage: clampedPercentage,
      tasmotaPercentage,
      command 
    });
    
    // Use Shutter mode Position command - Tasmota will move to exact position
    await this.sendCommand(command);
    
    console.log('[TasmotaApiService] setBlindsPosition END');
  }
}

export default TasmotaApiService;


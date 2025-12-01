// Type definitions for the Smart Home Control app

export enum DeviceType {
  GATE = 'gate',
  LIGHT = 'light',
  HEATING = 'heating',
  SENSOR = 'sensor',
  CAMERA = 'camera',
  BLINDS = 'blinds',
  AUDIO = 'audio',
  DEVICES = 'devices',
  OTHER = 'other',
}

export enum GateType {
  ENTRANCE = 'entrance',
  GARAGE = 'garage',
  TERRACE_FIX = 'terrace-fix',
  TERRACE_DOOR = 'terrace-door',
}

export enum GateState {
  UNKNOWN = 'unknown',
  OPEN = 'open',
  CLOSED = 'closed',
  OPENING = 'opening',
  CLOSING = 'closing',
}

export type DeviceCategory = 'gates' | 'lights' | 'temperature' | 'devices';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  expiresIn: number;
}

export interface ApiError {
  error: string;
  message?: string;
}

export interface GateActionResponse {
  success: boolean;
  gate: string;
  action: string;
  state?: string;
}

export interface DeviceConfig {
  id: string;
  name: string;
  ipAddress?: string;
  type: DeviceType;
  enabled: boolean;
  category?: string; // 'security', 'comfort', 'energy', etc.
}

export interface SmartDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ipAddress?: string;
  enabled: boolean;
  category?: string; // Room category: 'kitchen', 'garden', 'living-room', 'bedroom', 'bathroom'
  room?: string; // Room name for filtering
}

export interface DeviceStatus {
  online: boolean;
  lastSeen?: number;
  [key: string]: any; // Allow device-specific status fields
}

export interface AppSettings {
  devices: DeviceConfig[];
  autoLock: boolean;
  biometricsEnabled: boolean;
  notificationsEnabled: boolean;
}

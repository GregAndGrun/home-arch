// Single source of truth for all devices
import { SmartDevice, DeviceType, GateType } from '../types';

/**
 * Centralized device data - this is the single source of truth
 * All screens should use this service to get device data
 */
export class DeviceService {
  private static devices: SmartDevice[] = [
    {
      id: GateType.GARAGE,
      name: 'Brama Garażowa',
      type: DeviceType.GATE,
      status: { online: false, lastSeen: 0 },
      enabled: true,
      category: 'garden',
      room: 'garden',
      gateType: GateType.GARAGE, // Add gateType for icon differentiation
    },
    {
      id: GateType.ENTRANCE,
      name: 'Brama Wjazdowa',
      type: DeviceType.GATE,
      status: { online: false, lastSeen: 0 },
      enabled: false, // Disabled
      category: 'garden',
      room: 'garden',
      gateType: GateType.ENTRANCE, // Add gateType for icon differentiation
    },
    {
      id: GateType.LIVING_ROOM_FIX,
      name: 'Roleta salon (fix)',
      type: DeviceType.BLINDS,
      status: { online: false, lastSeen: 0 },
      enabled: true,
      category: 'living-room',
      room: 'living-room',
      gateType: GateType.LIVING_ROOM_FIX,
    },
    {
      id: GateType.LIVING_ROOM_TERRACE,
      name: 'Roleta salon (taras)',
      type: DeviceType.BLINDS,
      status: { online: false, lastSeen: 0 },
      enabled: true,
      category: 'living-room',
      room: 'living-room',
      gateType: GateType.LIVING_ROOM_TERRACE,
    },
  ];

  /**
   * Get all devices
   */
  static async getAllDevices(): Promise<SmartDevice[]> {
    return [...this.devices];
  }

  /**
   * Get device by ID
   */
  static async getDeviceById(id: string): Promise<SmartDevice | undefined> {
    return this.devices.find(d => d.id === id);
  }

  /**
   * Get devices by category
   */
  static async getDevicesByCategory(category: string): Promise<SmartDevice[]> {
    return this.devices.filter(d => d.category === category);
  }

  /**
   * Get devices by type
   */
  static async getDevicesByType(types: DeviceType[]): Promise<SmartDevice[]> {
    return this.devices.filter(d => types.includes(d.type));
  }

  /**
   * Get devices filtered by category type (for category screens)
   */
  static async getDevicesByCategoryType(category: 'gates' | 'lights' | 'temperature' | 'devices' | 'all'): Promise<SmartDevice[]> {
    if (category === 'all') {
      return [...this.devices];
    }

    const categoryToDeviceType: Record<string, DeviceType[]> = {
      'gates': [DeviceType.GATE, DeviceType.BLINDS],
      'lights': [DeviceType.LIGHT],
      'temperature': [DeviceType.HEATING],
      'devices': [DeviceType.DEVICES],
    };

    const deviceTypes = categoryToDeviceType[category] || [];
    return this.devices.filter(d => deviceTypes.includes(d.type));
  }

  /**
   * Update device status
   */
  static async updateDeviceStatus(id: string, status: Partial<SmartDevice['status']>): Promise<void> {
    const device = this.devices.find(d => d.id === id);
    if (device) {
      device.status = { ...device.status, ...status };
    }
  }
}


import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { DeviceType, GateType } from '../types';
import { useTheme } from '../theme/useTheme';

interface IconProps {
  type: DeviceType;
  size?: number;
  color?: string;
  gateType?: GateType; // Optional gate type for icon differentiation
  deviceId?: string; // Optional device ID for icon differentiation
}

const Icon: React.FC<IconProps> = ({ type, size = 48, color, gateType, deviceId }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.textPrimary;

  const getIconName = (deviceType: DeviceType, gateType?: GateType, deviceId?: string): keyof typeof MaterialIcons.glyphMap => {
    switch (deviceType) {
      case DeviceType.GATE:
        // Different icons for different gate types
        if (gateType === GateType.ENTRANCE || deviceId === GateType.ENTRANCE) {
          return 'directions-car'; // Entrance gate = car icon
        } else if (gateType === GateType.GARAGE || deviceId === GateType.GARAGE) {
          return 'home'; // Garage gate = home icon
        }
        return 'home'; // Default for gates
      case DeviceType.LIGHT:
        return 'lightbulb';
      case DeviceType.HEATING:
        return 'thermostat';
      case DeviceType.SENSOR:
        return 'sensors';
      case DeviceType.CAMERA:
        return 'videocam';
      case DeviceType.BLINDS:
        return 'blinds';
      case DeviceType.AUDIO:
        return 'speaker';
      case DeviceType.DEVICES:
        return 'devices';
      case DeviceType.OTHER:
      default:
        return 'devices';
    }
  };

  return (
    <MaterialIcons
      name={getIconName(type, gateType, deviceId)}
      size={size}
      color={iconColor}
    />
  );
};

export default Icon;

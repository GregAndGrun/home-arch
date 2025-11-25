import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { DeviceType } from '../types';
import { useTheme } from '../theme/useTheme';

interface IconProps {
  type: DeviceType;
  size?: number;
  color?: string;
}

const Icon: React.FC<IconProps> = ({ type, size = 48, color }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.textPrimary;

  const getIconName = (deviceType: DeviceType): keyof typeof MaterialIcons.glyphMap => {
    switch (deviceType) {
      case DeviceType.GATE:
        return 'power-settings-new';
      case DeviceType.LIGHT:
        return 'lightbulb';
      case DeviceType.HEATING:
        return 'thermostat'; // Changed from 'ac-unit' to 'thermostat'
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
      name={getIconName(type)}
      size={size}
      color={iconColor}
    />
  );
};

export default Icon;

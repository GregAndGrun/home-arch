import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { DeviceType, SmartDevice } from '../types';
import Icon from './Icon';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';

interface DeviceCardProps {
  device: SmartDevice;
  onPress: () => void;
  hideStatus?: boolean;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onPress, hideStatus = false }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card },
        !device.enabled && styles.cardDisabled,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!device.enabled}
    >
      <View style={styles.iconContainer}>
        <Icon type={device.type} size={48} color={colors.textPrimary} />
      </View>
      <Text
        style={[styles.name, { color: colors.textPrimary, fontFamily: typography.fontFamily.semiBold }]}
        numberOfLines={2}
      >
        {device.name}
      </Text>
      {!hideStatus && (
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          {device.status.online ? 'Online' : 'Offline'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16, // Rounded corners as per new design
    padding: 20,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default DeviceCard;

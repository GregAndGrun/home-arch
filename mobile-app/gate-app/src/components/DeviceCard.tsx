import React, { useState, useEffect } from 'react';
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
import ActivityService from '../services/ActivityService';

interface DeviceCardProps {
  device: SmartDevice;
  onPress: () => void;
  hideStatus?: boolean;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onPress, hideStatus = false }) => {
  const { colors } = useTheme();
  const [lastActivity, setLastActivity] = useState<string | null>(null);

  useEffect(() => {
    const loadLastActivity = async () => {
      try {
        const activity = await ActivityService.getLastActivity(device.id);
        if (activity) {
          const timeDiff = Date.now() - activity.timestamp;
          const minutes = Math.floor(timeDiff / 60000);
          const hours = Math.floor(minutes / 60);
          const days = Math.floor(hours / 24);

          let timeString: string;
          if (days > 0) {
            timeString = `${days} ${days === 1 ? 'dzień' : 'dni'} temu`;
          } else if (hours > 0) {
            timeString = `${hours} ${hours === 1 ? 'godz.' : 'godz.'} temu`;
          } else if (minutes > 0) {
            timeString = `${minutes} ${minutes === 1 ? 'min' : 'min'} temu`;
          } else {
            timeString = 'Przed chwilą';
          }

          setLastActivity(timeString);
        }
      } catch (error) {
        console.error('[DeviceCard] Failed to load last activity:', error);
      }
    };

    loadLastActivity();
  }, [device.id]);

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
        <>
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            {device.status.online ? 'Online' : 'Offline'}
          </Text>
          {lastActivity && (
            <Text style={[styles.activityText, { color: colors.textSecondary }]}>
              Ostatnio: {lastActivity}
            </Text>
          )}
        </>
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
    marginTop: 4,
  },
  activityText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default DeviceCard;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SmartDevice, DeviceCategory } from '../types';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { DeviceService } from '../services/DeviceService';
import AnimatedDeviceCard from './AnimatedDeviceCard';

interface DevicesListContentProps {
  category: DeviceCategory | 'all';
  onDevicePress: (device: SmartDevice) => void;
}

const DevicesListContent: React.FC<DevicesListContentProps> = ({
  category,
  onDevicePress,
}) => {
  const { colors } = useTheme();
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDevices();
  }, [category]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const allDevices = await DeviceService.getDevicesByCategoryType(category);
      setDevices(allDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
      setDevices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDevices();
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
      }
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Ładowanie urządzeń...
          </Text>
        </View>
      ) : (
        <>
          {devices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Brak urządzeń w tej kategorii
              </Text>
            </View>
          ) : (
            devices.map((device, index) => (
              <AnimatedDeviceCard
                key={device.id}
                device={device}
                index={index}
                onPress={() => onDevicePress(device)}
                colors={colors}
                disabled={!device.enabled}
              />
            ))
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
});

export default DevicesListContent;


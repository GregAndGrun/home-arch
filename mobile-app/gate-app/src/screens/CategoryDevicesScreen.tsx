import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from '../components/Icon';
import SplitScreen from '../components/Layout/SplitScreen';
import { SmartDevice, DeviceType, DeviceCategory, CategoryType } from '../types';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { MaterialIcons } from '@expo/vector-icons';

interface CategoryDevicesScreenProps {
  category: DeviceCategory;
  room: CategoryType;
  onDevicePress: (device: SmartDevice) => void;
  onBack: () => void;
}

// Map category to DeviceType
const categoryToDeviceType: Record<DeviceCategory, DeviceType> = {
  'gates': DeviceType.GATE,
  'lights': DeviceType.LIGHT,
  'temperature': DeviceType.HEATING,
  'devices': DeviceType.DEVICES,
};

// Mock data - in real app this would come from API or storage
const getAllDevices = async (): Promise<SmartDevice[]> => {
  // Always include gates, even if API fails
  const gates: SmartDevice[] = [
    {
      id: 'gate_garage',
      name: 'Brama Garażowa',
      type: DeviceType.GATE,
      status: { online: false, lastSeen: 0 },
      enabled: true,
      category: 'garden',
      room: 'garden',
    },
    {
      id: 'gate_entrance',
      name: 'Brama Wjazdowa',
      type: DeviceType.GATE,
      status: { online: false, lastSeen: 0 },
      enabled: true,
      category: 'garden',
      room: 'garden',
    },
  ];

  return [
    // GATES (always included)
    ...gates,
    // Other device types are not available yet
  ];
};

const CategoryDevicesScreen: React.FC<CategoryDevicesScreenProps> = ({
  category,
  room,
  onDevicePress,
  onBack,
}) => {
  const { colors } = useTheme();
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDevices();
  }, [category, room]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const allDevices = await getAllDevices();
      const deviceType = categoryToDeviceType[category];
      
      // Filter by category type first
      let filtered = allDevices.filter(d => d.type === deviceType);
      
      // Then filter by room if not 'all'
      // For 'all', show all devices of this type regardless of room
      if (room !== 'all') {
        filtered = filtered.filter(d => {
          // Match by room or category field
          return d.room === room || d.category === room;
        });
      }
      
      setDevices(filtered);
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

  const getCategoryName = (): string => {
    const names: Record<DeviceCategory, string> = {
      'gates': 'Bramy/Rolety',
      'lights': 'Oświetlenie',
      'temperature': 'Temperatura',
      'devices': 'Urządzenia',
    };
    return names[category];
  };

  const getRoomName = (): string => {
    const names: Record<CategoryType, string> = {
      'all': 'Wszystkie',
      'kitchen': 'Kuchnia',
      'garden': 'Ogród',
      'living-room': 'Salon',
      'bedroom': 'Sypialnia',
      'bathroom': 'Łazienka',
    };
    return names[room];
  };

  const HeaderContent = () => (
    <View style={styles.headerRow}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SplitScreen title={`${getCategoryName()} - ${getRoomName()}`} headerContent={<HeaderContent />}>
      <ScrollView
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
              devices.map((device) => (
                <TouchableOpacity
                  key={device.id}
                  style={[styles.deviceListItem, { backgroundColor: colors.card }]}
                  onPress={() => onDevicePress(device)}
                  activeOpacity={0.7}
                >
                  <View style={styles.deviceListItemContent}>
                    <View style={styles.deviceIconContainer}>
                      <Icon type={device.type} size={32} color={colors.textPrimary} />
                    </View>
                    <View style={styles.deviceInfo}>
                      <Text style={[styles.deviceName, { color: colors.textPrimary, fontFamily: typography.fontFamily.semiBold }]}>
                        {device.name}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SplitScreen>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  deviceListItem: {
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deviceListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  deviceIconContainer: {
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
  },
});

export default CategoryDevicesScreen;


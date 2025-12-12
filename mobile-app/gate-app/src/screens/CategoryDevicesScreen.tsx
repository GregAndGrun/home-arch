import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Icon from '../components/Icon';
import SplitScreen from '../components/Layout/SplitScreen';
import CategoryHeader from '../components/CategoryHeader';
import { SmartDevice, DeviceType, DeviceCategory } from '../types';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { MaterialIcons } from '@expo/vector-icons';
import { StorageService } from '../services/StorageService';
import { DeviceService } from '../services/DeviceService';

interface CategoryDevicesScreenProps {
  category: DeviceCategory | 'all';
  onDevicePress: (device: SmartDevice) => void;
  onCategorySelect: (category: DeviceCategory | 'all') => void;
}

// Map category to DeviceType (kept for reference, but now using DeviceService)
const categoryToDeviceType: Record<DeviceCategory, DeviceType[]> = {
  'gates': [DeviceType.GATE, DeviceType.BLINDS], // Gates category includes both gates and blinds
  'lights': [DeviceType.LIGHT],
  'temperature': [DeviceType.HEATING],
  'devices': [DeviceType.DEVICES],
};

// Animated device card component
const AnimatedDeviceCard: React.FC<{
  device: SmartDevice;
  index: number;
  onPress: () => void;
  colors: any;
  disabled?: boolean;
}> = ({ device, index, onPress, colors, disabled = false }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        style={[
          styles.deviceListItem, 
          { backgroundColor: colors.card },
          disabled && styles.deviceListItemDisabled
        ]}
        onPress={disabled ? undefined : onPress}
        activeOpacity={disabled ? 1 : 0.7}
        disabled={disabled}
      >
        <View style={styles.deviceListItemContent}>
          <View style={styles.deviceIconContainer}>
            <Icon 
              type={device.type} 
              size={32} 
              color={disabled ? colors.textSecondary : colors.textPrimary}
              gateType={device.gateType}
              deviceId={device.id}
            />
          </View>
          <View style={styles.deviceInfo}>
            <Text style={[
              styles.deviceName, 
              { 
                color: disabled ? colors.textSecondary : colors.textPrimary, 
                fontFamily: typography.fontFamily.semiBold 
              }
            ]}>
              {device.name}
            </Text>
          </View>
          {!disabled && (
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const CategoryDevicesScreen: React.FC<CategoryDevicesScreenProps> = ({
  category,
  onDevicePress,
  onCategorySelect,
}) => {
  const { colors } = useTheme();
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory | 'all'>(category || 'all');

  useEffect(() => {
    loadUsername();
  }, []);

  useEffect(() => {
    setSelectedCategory(category || 'all');
  }, [category]);

  useEffect(() => {
    onCategorySelect(selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const loadUsername = async () => {
    const name = await StorageService.getUsername();
    setUsername(name || 'Użytkownik');
  };

  useEffect(() => {
    loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

      const loadDevices = async () => {
        setLoading(true);
        try {
          // Use DeviceService - single source of truth
          const allDevices = await DeviceService.getDevicesByCategoryType(selectedCategory);
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

  const getCategoryName = (): string => {
    if (selectedCategory === 'all') {
      return 'Wszystkie';
    }
    const names: Record<DeviceCategory, string> = {
      'gates': 'Rolety',
      'lights': 'Oświetlenie',
      'temperature': 'Temperatura',
      'devices': 'Urządzenia',
    };
    return names[selectedCategory as DeviceCategory];
  };

  const getCategoryIcon = (): keyof typeof MaterialIcons.glyphMap => {
    const icons: Record<DeviceCategory | 'all', keyof typeof MaterialIcons.glyphMap> = {
      'all': 'dashboard',
      'gates': 'blinds',
      'lights': 'lightbulb',
      'temperature': 'thermostat',
      'devices': 'devices',
    };
    return icons[selectedCategory];
  };


  const HeaderContent = (
    <View>
      <View style={styles.headerTopRow}>
        <View>
          <Text style={[styles.greeting, { color: '#FFFFFF', fontFamily: typography.fontFamily.bold }]}>
            Cześć, {username}!
          </Text>
          <Text style={[styles.subGreeting, { color: 'rgba(255, 255, 255, 0.8)', fontFamily: typography.fontFamily.medium }]}>
            Witaj w domu
          </Text>
        </View>
      </View>
      <CategoryHeader 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
    </View>
  );

  return (
    <SplitScreen headerContent={HeaderContent}>
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
    </SplitScreen>
  );
};

const styles = StyleSheet.create({
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 15,
    marginBottom: 15,
    paddingLeft: 30,
    paddingRight: 10,
  },
  greeting: {
    fontSize: 24,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
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
  deviceListItemDisabled: {
    opacity: 0.5,
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


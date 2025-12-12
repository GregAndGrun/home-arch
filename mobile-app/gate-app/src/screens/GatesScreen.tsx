import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { GateType, GateState, DeviceCategory, DeviceType } from '../types';
import NetInfo from '@react-native-community/netinfo';
import SplitScreen from '../components/Layout/SplitScreen';
import CategoryHeader from '../components/CategoryHeader';
import Icon from '../components/Icon';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { MaterialIcons } from '@expo/vector-icons';
import { StorageService } from '../services/StorageService';
import { DeviceService } from '../services/DeviceService';

interface GatesScreenProps {
  onGatePress: (gateType: GateType) => void;
  onCategorySelect: (category: DeviceCategory | 'all') => void;
}

const GatesScreen: React.FC<GatesScreenProps> = ({ onGatePress, onCategorySelect }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [username, setUsername] = useState('');
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    loadUsername();
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      // Get only gates and blinds from DeviceService
      const allDevices = await DeviceService.getDevicesByCategoryType('gates');
      setDevices(allDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
      setDevices([]);
    }
  };

  const loadUsername = async () => {
    const name = await StorageService.getUsername();
    setUsername(name || 'Użytkownik');
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(false);
  };

  const getStateColor = (state: GateState): string => {
    switch (state) {
      case GateState.OPEN: return colors.success;
      case GateState.CLOSED: return colors.error;
      case GateState.OPENING:
      case GateState.CLOSING: return colors.accent;
      default: return colors.offline;
    }
  };

  const getStateText = (state: GateState): string => {
    switch (state) {
      case GateState.OPEN: return 'Otwarta';
      case GateState.CLOSED: return 'Zamknięta';
      case GateState.OPENING: return 'Otwieranie...';
      case GateState.CLOSING: return 'Zamykanie...';
      default: return 'Nieznany';
    }
  };

  const GateListItem: React.FC<{
    device: any;
    onPress: () => void;
    index?: number;
  }> = ({ device, onPress, index = 0 }) => {
    const disabled = !device.enabled;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          delay: index * 80,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          delay: index * 80,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          delay: index * 80,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);
    
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          style={[
            styles.gateCard,
            { backgroundColor: colors.card },
            disabled && styles.gateCardDisabled,
          ]}
          onPress={disabled ? undefined : onPress}
          activeOpacity={disabled ? 1 : 0.7}
          disabled={disabled}
        >
          <View style={styles.gateCardContent}>
            <View style={styles.gateIconContainer}>
              <Icon
                type={device.type}
                size={32}
                color={disabled ? colors.textSecondary : colors.textPrimary}
                gateType={device.gateType}
                deviceId={device.id}
              />
            </View>
            <View style={styles.gateInfo}>
              <Text
                style={[
                  styles.gateTitle,
                  {
                    color: disabled ? colors.textSecondary : colors.textPrimary,
                    fontFamily: typography.fontFamily.semiBold,
                  },
                ]}
              >
                {device.name}
              </Text>
            </View>
            {!disabled && (
              <MaterialIcons name="chevron-right" size={32} color={colors.textSecondary} />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
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
        selectedCategory="gates"
        onSelectCategory={(category) => {
          if (category === 'all') {
            onCategorySelect('all');
          } else if (category !== 'gates') {
            // Navigate to other category
            onCategorySelect(category);
          }
          // If 'gates' is selected, stay on this screen (do nothing)
        }}
      />
    </View>
  );

  return (
    <SplitScreen headerContent={HeaderContent}>
      {!isConnected && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.warning }]}>
          <Text style={styles.offlineText}>⚠️ Brak połączenia z siecią</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
      >
        {devices.map((device, index) => (
          <GateListItem
            key={device.id}
            device={device}
            onPress={() => onGatePress(device.id as GateType)}
            index={index}
          />
        ))}
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
  offlineBanner: {
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  offlineText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  contentContainer: {
    padding: 16,
  },
  gateCard: {
    borderRadius: 16, // Slightly rounded card inside the sheet
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gateCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  gateIconContainer: {
    marginRight: 16,
  },
  gateInfo: {
    flex: 1,
  },
  gateTitle: {
    fontSize: 18,
  },
  gateCardDisabled: {
    opacity: 0.5,
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
});

export default GatesScreen;

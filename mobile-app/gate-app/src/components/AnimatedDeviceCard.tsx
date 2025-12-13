import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Icon from './Icon';
import { SmartDevice } from '../types';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';

interface AnimatedDeviceCardProps {
  device: SmartDevice;
  index: number;
  onPress: () => void;
  colors: any;
  disabled?: boolean;
}

const AnimatedDeviceCard: React.FC<AnimatedDeviceCardProps> = ({ 
  device, 
  index, 
  onPress, 
  colors, 
  disabled = false 
}) => {
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

const styles = StyleSheet.create({
  deviceListItem: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  deviceListItemDisabled: {
    opacity: 0.5,
  },
  deviceListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  deviceIconContainer: {
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
  },
});

export default AnimatedDeviceCard;


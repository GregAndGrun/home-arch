import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { GateState } from '../types';

interface CircularGateControlProps {
  state: GateState;
  onToggle: () => void;
  loading?: boolean;
  disabled?: boolean;
  gateType?: 'garage' | 'entrance' | 'terrace-fix' | 'terrace-door';
}

const CircularGateControl: React.FC<CircularGateControlProps> = ({
  state,
  onToggle,
  loading,
  disabled,
  gateType = 'garage',
}) => {
  const { colors } = useTheme();

  // For garage gate and rolets, status is always UNKNOWN (no sensor available)
  const isGarageGate = gateType === 'garage';
  const isTerraceBlind = gateType === 'terrace-fix' || gateType === 'terrace-door';
  const hasNoStatus = isGarageGate || isTerraceBlind;
  const effectiveState = hasNoStatus ? GateState.UNKNOWN : state;
  
  const isOpen = effectiveState === GateState.OPEN || effectiveState === GateState.OPENING;
  const isMoving = effectiveState === GateState.OPENING || effectiveState === GateState.CLOSING;

  const getIcon = () => {
    if (isMoving && !hasNoStatus) return 'autorenew'; // spinning arrows
    // Use appropriate icon based on gate type
    if (isTerraceBlind) return 'blinds'; // Blinds icon for rolets
    if (gateType === 'garage') return 'home'; // Home icon for garage gate
    return 'directions-car'; // Car icon for entrance gate
  };

  const getStatusText = () => {
    // Garage gate and rolets always show empty status (cannot be read)
    if (hasNoStatus) return '';
    
    switch (effectiveState) {
      case GateState.OPEN: return 'OTWARTA';
      case GateState.CLOSED: return 'ZAMKNIĘTA';
      case GateState.OPENING: return 'OTWIERANIE...';
      case GateState.CLOSING: return 'ZAMYKANIE...';
      default: return '';
    }
  };

  // For garage gate and rolets, use accent color (neutral)
  const statusColor = hasNoStatus ? colors.accent : (isOpen ? colors.success : colors.accent);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.circle,
          {
            borderColor: disabled ? colors.textSecondary : statusColor,
            backgroundColor: colors.card,
          },
          disabled && styles.disabled,
        ]}
        onPress={onToggle}
        disabled={disabled || loading}
        activeOpacity={0.7}
      >
        <View style={[styles.innerCircle, { backgroundColor: colors.background }]}>
          {loading ? (
            <ActivityIndicator size="large" color={statusColor} />
          ) : (
            <>
              <View style={styles.iconContainer}>
                <MaterialIcons
                  name={getIcon()}
                  size={64}
                  color={disabled ? colors.textSecondary : statusColor}
                />
              </View>
              {getStatusText() && (
                <Text
                  style={[
                    styles.statusText,
                    { color: disabled ? colors.textSecondary : statusColor, fontFamily: typography.fontFamily.bold },
                  ]}
                >
                  {getStatusText()}
                </Text>
              )}
            </>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  circle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    borderStyle: 'dashed', // Gives a nice dial effect
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  innerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
  },
  statusText: {
    marginTop: 16,
    fontSize: 18,
    letterSpacing: 1,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
    borderColor: '#CCCCCC',
  },
});

export default CircularGateControl;

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
  gateType?: 'garage' | 'entrance';
}

const CircularGateControl: React.FC<CircularGateControlProps> = ({
  state,
  onToggle,
  loading,
  disabled,
  gateType = 'garage',
}) => {
  const { colors } = useTheme();

  const isOpen = state === GateState.OPEN || state === GateState.OPENING;
  const isMoving = state === GateState.OPENING || state === GateState.CLOSING;

  const getIcon = () => {
    if (isMoving) return 'autorenew'; // spinning arrows
    // Use home icon for garage gate, car for entrance
    return gateType === 'garage' ? 'home' : 'directions-car';
  };

  const getStatusText = () => {
    switch (state) {
      case GateState.OPEN: return 'OTWARTA';
      case GateState.CLOSED: return 'ZAMKNIĘTA';
      case GateState.OPENING: return 'OTWIERANIE...';
      case GateState.CLOSING: return 'ZAMYKANIE...';
      default: return ''; // Remove "NIEZNANY"
    }
  };

  const statusColor = isOpen ? colors.success : colors.accent;

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

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { GateState } from '../types';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { hexToRgba } from '../theme/colors';

interface GateControlPanelProps {
  gateName: string;
  state: GateState;
  onTrigger: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const GateControlPanel: React.FC<GateControlPanelProps> = ({
  gateName,
  state,
  onTrigger,
  onOpen,
  onClose,
  loading = false,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getStateColor = (): string => {
    switch (state) {
      case GateState.OPEN:
        return colors.success;
      case GateState.CLOSED:
        return colors.error;
      case GateState.OPENING:
      case GateState.CLOSING:
        return colors.accent; // Pomarańczowy dla akcji
      default:
        return colors.offline;
    }
  };

  const getStateText = (): string => {
    switch (state) {
      case GateState.OPEN:
        return 'Otwarta';
      case GateState.CLOSED:
        return 'Zamknięta';
      case GateState.OPENING:
        return 'Otwieranie...';
      case GateState.CLOSING:
        return 'Zamykanie...';
      default:
        return 'Nieznany';
    }
  };

  const getStateIcon = (): string => {
    switch (state) {
      case GateState.OPEN:
        return '🟢';
      case GateState.CLOSED:
        return '🔴';
      case GateState.OPENING:
      case GateState.CLOSING:
        return '🟡';
      default:
        return '⚪';
    }
  };

  const handleButtonPress = (callback: () => void) => {
    // Animacja kliknięcia
    const scaleAnim = new Animated.Value(1);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    callback();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.card },
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.statusContainer}>
        <Text style={styles.statusIcon}>{getStateIcon()}</Text>
        <View style={styles.statusInfo}>
          <Text
            style={[
              styles.gateName,
              { color: colors.textPrimary, fontFamily: typography.fontFamily.bold },
            ]}
          >
            {gateName}
          </Text>
          <View
            style={[
              styles.stateBadge,
              { backgroundColor: getStateColor() },
            ]}
          >
            <Text style={styles.stateText}>{getStateText()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: hexToRgba(colors.accent, 0.1) }, // 10% opacity
            (disabled || loading) && styles.buttonDisabled,
          ]}
          onPress={() => handleButtonPress(onTrigger)}
          disabled={disabled || loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: colors.accent }]}>
              {state === GateState.OPEN || state === GateState.OPENING
                ? 'Zamknij'
                : 'Otwórz'}
            </Text>
          )}
        </TouchableOpacity>

        {onOpen && onClose && (
          <View style={styles.secondaryButtons}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: colors.button },
                (disabled || loading || state === GateState.OPEN) &&
                  styles.buttonDisabled,
              ]}
              onPress={() => onOpen && handleButtonPress(onOpen)}
              disabled={disabled || loading || state === GateState.OPEN}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
                Otwórz
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: colors.button },
                (disabled || loading || state === GateState.CLOSED) &&
                  styles.buttonDisabled,
              ]}
              onPress={() => onClose && handleButtonPress(onClose)}
              disabled={disabled || loading || state === GateState.CLOSED}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
                Zamknij
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 0, // Kwadratowy design
    padding: 24,
    margin: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  gateName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stateBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 0, // Kwadratowy
  },
  stateText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  controlsContainer: {
    gap: 12,
  },
  controlButton: {
    borderRadius: 0, // Kwadratowy
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default GateControlPanel;


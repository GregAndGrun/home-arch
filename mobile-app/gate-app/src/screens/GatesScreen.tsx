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
import { GateType, GateState } from '../types';
import NetInfo from '@react-native-community/netinfo';
import SplitScreen from '../components/Layout/SplitScreen';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { MaterialIcons } from '@expo/vector-icons';

interface GatesScreenProps {
  onGatePress: (gateType: GateType) => void;
  onBack: () => void;
}

const GatesScreen: React.FC<GatesScreenProps> = ({ onGatePress, onBack }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

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
    title: string;
    gateType: GateType;
    state: GateState;
    onPress: () => void;
    disabled?: boolean;
    index?: number;
  }> = ({ title, gateType, state, onPress, disabled = false, index = 0 }) => {
    // Different icons for different gates/rolets
    const getGateIcon = () => {
      switch (gateType) {
        case GateType.GARAGE:
          return 'home'; // Garage gate icon
        case GateType.ENTRANCE:
          return 'directions-car'; // Entrance gate icon
        case GateType.TERRACE_FIX:
        case GateType.TERRACE_DOOR:
          return 'blinds'; // Blinds icon for rolets
        default:
          return 'home';
      }
    };

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
              <MaterialIcons
                name={getGateIcon()}
                size={32}
                color={disabled ? colors.textSecondary : colors.textPrimary}
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
                {title}
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

  return (
    <SplitScreen title="Bramy" titleIcon="blinds" onBack={onBack}>
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
        <>
            <GateListItem
              title="Brama Garażowa"
              gateType={GateType.GARAGE}
              state={GateState.UNKNOWN}
              onPress={() => onGatePress(GateType.GARAGE)}
              index={0}
            />

            <GateListItem
              title="Brama Wjazdowa"
              gateType={GateType.ENTRANCE}
              state={GateState.UNKNOWN}
              onPress={() => onGatePress(GateType.ENTRANCE)}
              disabled={true}
              index={1}
            />

            <GateListItem
              title="Roleta taras (fix)"
              gateType={GateType.TERRACE_FIX}
              state={GateState.UNKNOWN}
              onPress={() => onGatePress(GateType.TERRACE_FIX)}
              disabled={true}
              index={2}
            />

            <GateListItem
              title="Roleta taras (drzwi)"
              gateType={GateType.TERRACE_DOOR}
              state={GateState.UNKNOWN}
              onPress={() => onGatePress(GateType.TERRACE_DOOR)}
              disabled={true}
              index={3}
            />
        </>
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

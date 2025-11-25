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
import { GateType, GateState, GatesStatusResponse } from '../types';
import ApiService from '../services/ApiService';
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
  const [gatesStatus, setGatesStatus] = useState<GatesStatusResponse>({
    entrance: { state: GateState.UNKNOWN, hasSensor: false, lastAction: 0 },
    garage: { state: GateState.UNKNOWN, hasSensor: false, lastAction: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    loadGatesStatus();

    const interval = setInterval(() => {
      loadGatesStatus(true);
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadGatesStatus = async (silent: boolean = false) => {
    if (!silent) setLoading(true);

    try {
      const status = await ApiService.getGatesStatus();
      setGatesStatus(status);
    } catch (error: any) {
      console.error('Error loading gates status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadGatesStatus();
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
  }> = ({ title, gateType, state, onPress }) => {
    // Different icons for different gates
    const gateIcon = gateType === GateType.GARAGE 
      ? 'home' // Garage gate icon (home)
      : 'directions-car'; // Entrance gate icon (car) or 'fence' if available
    
    return (
      <TouchableOpacity
        style={[styles.gateCard, { backgroundColor: colors.card }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.gateCardContent}>
          <View style={styles.gateIconContainer}>
            <MaterialIcons name={gateIcon} size={32} color={colors.textPrimary} />
          </View>
          <View style={styles.gateInfo}>
            <Text style={[styles.gateTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.semiBold }]}>
              {title}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={32} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  const HeaderContent = () => (
    <View style={styles.headerRow}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SplitScreen title="Bramy" headerContent={<HeaderContent />}>
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
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Ładowanie statusu bram...</Text>
          </View>
        ) : (
          <>
            <GateListItem
              title="Brama Garażowa"
              gateType={GateType.GARAGE}
              state={gatesStatus.garage.state}
              onPress={() => onGatePress(GateType.GARAGE)}
            />

            <GateListItem
              title="Brama Wjazdowa"
              gateType={GateType.ENTRANCE}
              state={gatesStatus.entrance.state}
              onPress={() => onGatePress(GateType.ENTRANCE)}
            />
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

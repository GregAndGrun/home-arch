import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { GateType, GateState } from '../types';
import ApiService from '../services/ApiService';
import NetInfo from '@react-native-community/netinfo';
import SplitScreen from '../components/Layout/SplitScreen';
import CircularGateControl from '../components/CircularGateControl';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { MaterialIcons } from '@expo/vector-icons';

interface GateDetailScreenProps {
  gateType: GateType;
  onBack: () => void;
}

const GateDetailScreen: React.FC<GateDetailScreenProps> = ({
  gateType,
  onBack,
}) => {
  const { colors } = useTheme();
  const [gateState, setGateState] = useState<GateState>(GateState.UNKNOWN);
  const [refreshing, setRefreshing] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const gateName =
    gateType === GateType.GARAGE ? 'Garaż' : 'Brama Wjazdowa';

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    loadGateStatus();

    const interval = setInterval(() => {
      loadGateStatus(true);
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [gateType]);

  const loadGateStatus = async (silent: boolean = false) => {
    try {
      const status = await ApiService.getGatesStatus();
      setGateState(
        gateType === GateType.GARAGE ? status.garage.state : status.entrance.state
      );
    } catch (error: any) {
      console.error('Error loading gate status:', error);
      if (!silent) {
        setGateState(GateState.UNKNOWN);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadGateStatus();
  };

  const handleTrigger = async () => {
    if (!isConnected) {
      Alert.alert('Brak połączenia', 'Sprawdź połączenie z siecią');
      return;
    }

    setTriggering(true);
    try {
      await ApiService.triggerGate(gateType);
      setTimeout(() => loadGateStatus(true), 500);
    } catch (error: any) {
      Alert.alert('Błąd', error.message || 'Nie udało się sterować bramą');
    } finally {
      setTriggering(false);
    }
  };

  const HeaderContent = () => (
    <View style={styles.headerRow}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const GraphPlaceholder = () => (
    <View style={[styles.graphCard, { backgroundColor: colors.card }]}>
      <View style={styles.graphHeader}>
        <Text style={[styles.graphTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
          AKTYWNOŚĆ
        </Text>
        <Text style={[styles.graphSubtitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.medium }]}>
          DZISIAJ
        </Text>
      </View>
      <View style={styles.graphBars}>
        {[...Array(24)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.graphBar,
              {
                backgroundColor: i > 8 && i < 20 ? colors.accent : colors.border,
                height: Math.random() * 40 + 10,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.graphLabels}>
        <Text style={[styles.graphLabel, { color: colors.textSecondary }]}>12h</Text>
        <Text style={[styles.graphLabel, { color: colors.textSecondary }]}>15h</Text>
        <Text style={[styles.graphLabel, { color: colors.textSecondary }]}>18h</Text>
        <Text style={[styles.graphLabel, { color: colors.textSecondary }]}>21h</Text>
        <Text style={[styles.graphLabel, { color: colors.textSecondary }]}>0h</Text>
      </View>
    </View>
  );

  return (
    <SplitScreen title={gateName} headerContent={<HeaderContent />}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
      >
        <View style={styles.controlWrapper}>
          <CircularGateControl
            state={gateState}
            onToggle={handleTrigger}
            loading={triggering}
            disabled={!isConnected}
            gateType={gateType === GateType.GARAGE ? 'garage' : 'entrance'}
          />
        </View>

        <GraphPlaceholder />

        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.semiBold }]}>
            Informacje
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Status: {isConnected ? 'Połączono' : 'Brak połączenia'}
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Ostatnia aktualizacja: {new Date().toLocaleTimeString()}
          </Text>
        </View>
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
  controlWrapper: {
    marginBottom: 30,
    alignItems: 'center',
  },
  graphCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  graphTitle: {
    fontSize: 14,
    letterSpacing: 1,
  },
  graphSubtitle: {
    fontSize: 12,
  },
  graphBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 60,
    marginBottom: 10,
  },
  graphBar: {
    width: 4,
    borderRadius: 2,
  },
  graphLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  graphLabel: {
    fontSize: 10,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
  },
});

export default GateDetailScreen;

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import ActivityService from '../services/ActivityService';
import NetInfo from '@react-native-community/netinfo';
import SplitScreen from '../components/Layout/SplitScreen';
import CircularGateControl from '../components/CircularGateControl';
import BlindsControl from '../components/BlindsControl';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { MaterialIcons } from '@expo/vector-icons';

interface GateDetailScreenProps {
  gateType: GateType;
  onBack: () => void;
  onAuthRequired?: (action: () => Promise<void>) => void;
}

const GateDetailScreen: React.FC<GateDetailScreenProps> = ({
  gateType,
  onBack,
  onAuthRequired,
}) => {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [todayActivities, setTodayActivities] = useState<number[]>([]);
  const [hasRealActivities, setHasRealActivities] = useState(false);
  const [blindsPosition, setBlindsPosition] = useState<number>(-1);
  const [blindsLoading, setBlindsLoading] = useState(false);
  const [headerPositionDisplay, setHeaderPositionDisplay] = useState<React.ReactNode>(null);
  const [isDraggingBlinds, setIsDraggingBlinds] = useState(false);
  const [blindsDirection, setBlindsDirection] = useState<number>(0); // -1 = closing, 0 = stopped, 1 = opening
  const positionPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isBlinds = gateType === GateType.LIVING_ROOM_FIX || gateType === GateType.LIVING_ROOM_TERRACE;

  const gateName = useMemo(() => {
    switch (gateType) {
      case GateType.GARAGE:
        return 'Garaż';
      case GateType.ENTRANCE:
        return 'Brama Wjazdowa';
      case GateType.LIVING_ROOM_FIX:
        return 'Roleta salon (fix)';
      case GateType.LIVING_ROOM_TERRACE:
        return 'Roleta salon (taras)';
      default:
        return 'Brama';
    }
  }, [gateType]);

  const gateTypeRef = useRef(gateType);
  gateTypeRef.current = gateType;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    // Load initial data
    const loadInitialData = async () => {
      await loadTodayActivities();
      if (isBlinds) {
        await loadBlindsStatus();
      }
    };
    loadInitialData();

    return () => {
      unsubscribe();
      // Cleanup polling interval
      if (positionPollingIntervalRef.current) {
        clearInterval(positionPollingIntervalRef.current);
        positionPollingIntervalRef.current = null;
      }
    };
  }, [isBlinds]);

  // Auto-refresh position - continuous polling to detect external changes (e.g., wall buttons)
  useEffect(() => {
    if (!isBlinds) return;

    // Clear existing interval
    if (positionPollingIntervalRef.current) {
      clearInterval(positionPollingIntervalRef.current);
      positionPollingIntervalRef.current = null;
    }

    // Always poll to detect external changes (wall buttons, etc.)
    // Poll more frequently when moving, less frequently when stopped
    const pollInterval = blindsDirection !== 0 ? 500 : 2000; // 500ms when moving, 2s when stopped
    
    const pollStatus = async () => {
      if (isBlinds) {
        await loadBlindsStatus();
      }
    };
    
    positionPollingIntervalRef.current = setInterval(pollStatus, pollInterval);

    return () => {
      if (positionPollingIntervalRef.current) {
        clearInterval(positionPollingIntervalRef.current);
        positionPollingIntervalRef.current = null;
      }
    };
  }, [blindsDirection, isBlinds]);

  const loadTodayActivities = useCallback(async () => {
    try {
      const deviceId = `gate-${gateType}`;
      
      // Calculate today's date range (using local Polish time)
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      
      // Get activities for today
      const activities = await ActivityService.getActivitiesByDateRange(startOfDay.getTime(), endOfDay.getTime());
      const filteredActivities = activities.filter(activity => activity.deviceId === deviceId);
      
      // Group activities by hour (using local Polish time)
      const hourCounts = new Array(24).fill(0);
      filteredActivities.forEach(activity => {
        // Convert timestamp to local date (Polish timezone)
        const date = new Date(activity.timestamp);
        // Use local time methods to get hour in Polish timezone
        const hour = date.getHours(); // This uses device's local timezone
        hourCounts[hour]++;
      });
      
      // Normalize to 0-100 scale for visualization
      const maxCount = Math.max(...hourCounts);
      if (maxCount === 0) {
        // No activities - show empty bars
        setTodayActivities(new Array(24).fill(10));
        setHasRealActivities(false);
      } else {
        const normalized = hourCounts.map(count => (count / maxCount) * 50 + 10);
        setTodayActivities(normalized);
        setHasRealActivities(true);
      }
    } catch (error) {
      console.error('[GateDetailScreen] Failed to load activities:', error);
      setTodayActivities(new Array(24).fill(10));
      setHasRealActivities(false);
    }
  }, [gateType]);

  const loadBlindsPosition = useCallback(async (): Promise<number> => {
    if (!isBlinds) return -1;
    try {
      const position = await ApiService.getBlindsPosition(gateType);
      setBlindsPosition(position);
      return position;
    } catch (error) {
      console.error('[GateDetailScreen] Failed to load blinds position:', error);
      setBlindsPosition(-1);
      return -1;
    }
  }, [gateType, isBlinds]);

  const loadBlindsStatus = useCallback(async () => {
    if (!isBlinds) return;
    try {
      const status = await ApiService.getBlindsStatus(gateType);
      setBlindsPosition(status.position);
      setBlindsDirection(status.direction);
      return status.direction !== 0; // Return true if moving
    } catch (error) {
      console.error('[GateDetailScreen] Failed to load blinds status:', error);
      setBlindsPosition(-1);
      setBlindsDirection(0);
      return false;
    }
  }, [gateType, isBlinds]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTodayActivities();
    if (isBlinds) {
      await loadBlindsStatus();
    }
    setRefreshing(false);
  };

  const handleTrigger = async () => {
    if (!isConnected) {
      Alert.alert('Brak połączenia', 'Sprawdź połączenie z siecią');
      return;
    }

    setTriggering(true);
    try {
      await ApiService.triggerGate(gateType);
      // Reload activities after successful trigger
      await loadTodayActivities();
      if (isBlinds) {
        setTimeout(() => loadBlindsStatus(), 200);
      }
    } catch (error: any) {
      if (error.message === 'AUTH_REQUIRED' && onAuthRequired) {
        // Lazy authentication for ESP32 - retry after login
        onAuthRequired(async () => {
          await ApiService.triggerGate(gateType);
          await loadTodayActivities();
          if (isBlinds) {
            setTimeout(() => loadBlindsStatus(), 200);
          }
        });
        setTriggering(false);
        return;
      }
      Alert.alert('Błąd', error.message || 'Nie udało się sterować bramą');
    } finally {
      setTriggering(false);
    }
  };

  // Blinds control handlers
  const handleBlindsOpen = async () => {
    if (!isConnected) {
      Alert.alert('Brak połączenia', 'Sprawdź połączenie z siecią');
      return;
    }
    setBlindsLoading(true);
    try {
      await ApiService.openGate(gateType);
      await loadTodayActivities();
      // Start polling immediately - loadBlindsStatus will detect movement
      setTimeout(() => loadBlindsStatus(), 200);
    } catch (error: any) {
      Alert.alert('Błąd', error.message || 'Nie udało się otworzyć rolet');
    } finally {
      setBlindsLoading(false);
    }
  };

  const handleBlindsClose = async () => {
    if (!isConnected) {
      Alert.alert('Brak połączenia', 'Sprawdź połączenie z siecią');
      return;
    }
    setBlindsLoading(true);
    try {
      await ApiService.closeGate(gateType);
      await loadTodayActivities();
      // Start polling immediately - loadBlindsStatus will detect movement
      setTimeout(() => loadBlindsStatus(), 200);
    } catch (error: any) {
      Alert.alert('Błąd', error.message || 'Nie udało się zamknąć rolet');
    } finally {
      setBlindsLoading(false);
    }
  };

  const handleBlindsStop = async () => {
    if (!isConnected) {
      Alert.alert('Brak połączenia', 'Sprawdź połączenie z siecią');
      return;
    }
    setBlindsLoading(true);
    try {
      await ApiService.stopBlinds(gateType);
      await loadTodayActivities();
      // Stop polling and get final position
      if (positionPollingIntervalRef.current) {
        clearInterval(positionPollingIntervalRef.current);
        positionPollingIntervalRef.current = null;
      }
      await loadBlindsStatus();
    } catch (error: any) {
      Alert.alert('Błąd', error.message || 'Nie udało się zatrzymać rolet');
    } finally {
      setBlindsLoading(false);
    }
  };

  const handleBlindsPositionChange = async (percentage: number) => {
    console.log('[GateDetailScreen] handleBlindsPositionChange START:', { percentage, isConnected, gateType });
    if (!isConnected) {
      console.log('[GateDetailScreen] handleBlindsPositionChange BLOCKED: not connected');
      Alert.alert('Brak połączenia', 'Sprawdź połączenie z siecią');
      return;
    }
    setBlindsLoading(true);
    try {
      console.log('[GateDetailScreen] handleBlindsPositionChange calling ApiService.setBlindsPosition:', { percentage });
      await ApiService.setBlindsPosition(gateType, percentage);
      console.log('[GateDetailScreen] handleBlindsPositionChange ApiService.setBlindsPosition completed');
      await loadTodayActivities();
      // Start polling immediately - loadBlindsStatus will detect movement
      setTimeout(() => loadBlindsStatus(), 200);
    } catch (error: any) {
      Alert.alert('Błąd', error.message || 'Nie udało się ustawić pozycji rolet');
    } finally {
      setBlindsLoading(false);
    }
  };


  // Memoize graph bars to prevent unnecessary re-renders
  const graphBars = useMemo(() => {
    return todayActivities.map((height, i) => {
      // Show accent color if there are real activities and this bar has activity (height > 10)
      const hasActivity = hasRealActivities && height > 10;
      return (
        <View
          key={i}
          style={[
            styles.graphBar,
            {
              backgroundColor: hasActivity ? colors.accent : colors.border,
              height: height,
            },
          ]}
        />
      );
    });
  }, [todayActivities, hasRealActivities, colors.accent, colors.border]);

  const GraphPlaceholder = () => {
    return (
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
          {graphBars}
        </View>
        <View style={styles.graphLabels}>
          <Text style={[styles.graphLabel, { color: colors.textSecondary }]}>00:00</Text>
          <Text style={[styles.graphLabel, { color: colors.textSecondary }]}>04:00</Text>
          <Text style={[styles.graphLabel, { color: colors.textSecondary }]}>08:00</Text>
          <Text style={[styles.graphLabel, { color: colors.textSecondary }]}>12:00</Text>
          <Text style={[styles.graphLabel, { color: colors.textSecondary }]}>16:00</Text>
          <Text style={[styles.graphLabel, { color: colors.textSecondary }]}>20:00</Text>
          <Text style={[styles.graphLabel, { color: colors.textSecondary }]}>23:59</Text>
        </View>
      </View>
    );
  };

  const headerContent = isBlinds && headerPositionDisplay ? headerPositionDisplay : null;

  // Determine icon for header based on gate type
  const getTitleIcon = (): keyof typeof MaterialIcons.glyphMap | undefined => {
    if (isBlinds) return "blinds";
    if (gateType === GateType.GARAGE) return "home";
    if (gateType === GateType.ENTRANCE) return "directions-car";
    return undefined;
  };

  return (
    <SplitScreen title={gateName} titleIcon={getTitleIcon()} onBack={onBack} headerContent={headerContent}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        scrollEnabled={!isDraggingBlinds}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
      >
        <View style={styles.controlWrapper}>
          {isBlinds ? (
            <BlindsControl
              onOpen={handleBlindsOpen}
              onClose={handleBlindsClose}
              onStop={handleBlindsStop}
              onPositionChange={handleBlindsPositionChange}
              onPositionRefresh={loadBlindsPosition}
              onPositionDisplayReady={setHeaderPositionDisplay}
              onDragStateChange={setIsDraggingBlinds}
              loading={blindsLoading}
              disabled={!isConnected}
              currentPosition={blindsPosition}
              mockMode={false}
            />
          ) : (
            <CircularGateControl
              state={GateState.UNKNOWN}
              onToggle={handleTrigger}
              loading={triggering}
              disabled={!isConnected}
              gateType={
                gateType === GateType.GARAGE
                  ? 'garage'
                  : 'entrance'
              }
            />
          )}
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
    flexWrap: 'nowrap',
    width: '100%',
  },
  graphBar: {
    width: 4,
    borderRadius: 2,
    flexShrink: 0,
  },
  graphLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 2, // Small padding to align with bars
  },
  graphLabel: {
    fontSize: 10,
    width: 40, // Fixed width for consistent spacing
    textAlign: 'center',
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

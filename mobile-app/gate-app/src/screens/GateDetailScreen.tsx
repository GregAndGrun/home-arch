import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  const [gateState] = useState<GateState>(GateState.UNKNOWN);
  const [refreshing, setRefreshing] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [todayActivities, setTodayActivities] = useState<number[]>([]);
  const [hasRealActivities, setHasRealActivities] = useState(false);

  const getGateName = (): string => {
    switch (gateType) {
      case GateType.GARAGE:
        return 'Garaż';
      case GateType.ENTRANCE:
        return 'Brama Wjazdowa';
      case GateType.TERRACE_FIX:
        return 'Roleta taras (fix)';
      case GateType.TERRACE_DOOR:
        return 'Roleta taras (drzwi)';
      default:
        return 'Brama';
    }
  };

  const gateName = getGateName();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    loadTodayActivities();

    return () => {
      unsubscribe();
    };
  }, [gateType, loadTodayActivities]);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTodayActivities();
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
    } catch (error: any) {
      Alert.alert('Błąd', error.message || 'Nie udało się sterować bramą');
    } finally {
      setTriggering(false);
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

  return (
    <SplitScreen title={gateName} onBack={onBack}>
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
            gateType={
              gateType === GateType.GARAGE
                ? 'garage'
                : gateType === GateType.TERRACE_FIX
                ? 'terrace-fix'
                : gateType === GateType.TERRACE_DOOR
                ? 'terrace-door'
                : 'entrance'
            }
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

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import ActivityService, { DeviceActivity } from '../services/ActivityService';
import SplitScreen from '../components/Layout/SplitScreen';
import { MaterialIcons } from '@expo/vector-icons';

interface StatsScreenProps {}

interface ActivityStats {
  today: number;
  yesterday: number;
  week: number;
  mostUsed: { deviceName: string; count: number }[];
  byCategory: {
    gates: number;
    lights: number;
    temperature: number;
    devices: number;
  };
}

// Animated category card component
const AnimatedCategoryCard: React.FC<{
  index: number;
  icon: string;
  value: number;
  label: string;
  colors: any;
}> = ({ index, icon, value, label, colors }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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
      <View style={[styles.categoryCard, { backgroundColor: colors.card }]}>
        <MaterialIcons name={icon as any} size={24} color={colors.accent} />
        <Text style={[styles.categoryValue, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
          {value}
        </Text>
        <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
    </Animated.View>
  );
};

const StatsScreen: React.FC<StatsScreenProps> = () => {
  const { colors } = useTheme();
  const [stats, setStats] = useState<ActivityStats>({
    today: 0,
    yesterday: 0,
    week: 0,
    mostUsed: [],
    byCategory: {
      gates: 0,
      lights: 0,
      temperature: 0,
      devices: 0,
    },
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const now = Date.now();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);

      const todayActivities = await ActivityService.getActivitiesByDateRange(
        todayStart.getTime(),
        now
      );
      const yesterdayActivities = await ActivityService.getActivitiesByDateRange(
        yesterdayStart.getTime(),
        todayStart.getTime()
      );
      const weekActivities = await ActivityService.getActivitiesByDateRange(
        weekStart.getTime(),
        now
      );

      // Count by device
      const deviceCounts: Record<string, number> = {};
      weekActivities.forEach((activity) => {
        deviceCounts[activity.deviceName] = (deviceCounts[activity.deviceName] || 0) + 1;
      });

      const mostUsed = Object.entries(deviceCounts)
        .map(([deviceName, count]) => ({ deviceName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Count by category
      const byCategory = {
        gates: weekActivities.filter((a) => a.deviceType === 'gate').length,
        lights: weekActivities.filter((a) => a.deviceType === 'light').length,
        temperature: weekActivities.filter((a) => a.deviceType === 'heating').length,
        devices: weekActivities.filter((a) => a.deviceType === 'devices').length,
      };

      setStats({
        today: todayActivities.length,
        yesterday: yesterdayActivities.length,
        week: weekActivities.length,
        mostUsed,
        byCategory,
      });
    } catch (error) {
      console.error('[StatsScreen] Failed to load stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const StatCard: React.FC<{ title: string; value: string | number; icon: string; index: number }> = ({
    title,
    value,
    icon,
    index,
  }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          flex: 1,
        }}
      >
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <MaterialIcons name={icon as any} size={32} color={colors.accent} />
          <Text style={[styles.statValue, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
            {value}
          </Text>
          <Text style={[styles.statTitle, { color: colors.textSecondary }]}>
            {title}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SplitScreen title="Statystyki" titleIcon="bar-chart">
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.medium }]}>
            AKTYWNOŚĆ
          </Text>
          <View style={styles.statsGrid}>
            <StatCard title="Dzisiaj" value={stats.today} icon="today" index={0} />
            <StatCard title="Wczoraj" value={stats.yesterday} icon="history" index={1} />
            <StatCard title="Tydzień" value={stats.week} icon="date-range" index={2} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.medium }]}>
            KATEGORIE
          </Text>
          <View style={styles.categoryGrid}>
            <AnimatedCategoryCard
              index={0}
              icon="blinds"
              value={stats.byCategory.gates}
              label="Bramy"
              colors={colors}
            />
            <AnimatedCategoryCard
              index={1}
              icon="lightbulb"
              value={stats.byCategory.lights}
              label="Światła"
              colors={colors}
            />
            <AnimatedCategoryCard
              index={2}
              icon="thermostat"
              value={stats.byCategory.temperature}
              label="Temperatura"
              colors={colors}
            />
            <AnimatedCategoryCard
              index={3}
              icon="devices"
              value={stats.byCategory.devices}
              label="Urządzenia"
              colors={colors}
            />
          </View>
        </View>

        {stats.mostUsed.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.medium }]}>
              NAJCZĘŚCIEJ UŻYWANE
            </Text>
            <View style={[styles.mostUsedContainer, { backgroundColor: colors.card }]}>
              {stats.mostUsed.map((item, index) => (
                <AnimatedMostUsedItem
                  key={item.deviceName}
                  item={item}
                  index={index}
                  colors={colors}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SplitScreen>
  );
};

// Animated most used item component
const AnimatedMostUsedItem: React.FC<{
  item: { deviceName: string; count: number };
  index: number;
  colors: any;
}> = ({ item, index, colors }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <View style={styles.mostUsedItem}>
                  <View style={[styles.rankBadge, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.rankText, { color: '#000', fontFamily: typography.fontFamily.bold }]}>
                      {index + 1}
                    </Text>
                  </View>
        <View style={styles.mostUsedInfo}>
          <Text style={[styles.mostUsedName, { color: colors.textPrimary, fontFamily: typography.fontFamily.semiBold }]}>
            {item.deviceName}
          </Text>
          <Text style={[styles.mostUsedCount, { color: colors.textSecondary }]}>
            {item.count} {item.count === 1 ? 'użycie' : 'użyć'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 16,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 0,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 0,
    padding: 16,
    alignItems: 'center',
    margin: 6,
  },
  categoryValue: {
    fontSize: 24,
    marginTop: 8,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  mostUsedContainer: {
    borderRadius: 0,
    padding: 16,
  },
  mostUsedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
  },
  mostUsedInfo: {
    flex: 1,
  },
  mostUsedName: {
    fontSize: 16,
    marginBottom: 2,
  },
  mostUsedCount: {
    fontSize: 12,
  },
});

export default StatsScreen;


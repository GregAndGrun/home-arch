import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from 'react-native';
import DeviceCard from '../components/DeviceCard';
import SplitScreen from '../components/Layout/SplitScreen';
import CategoryHeader, { CategoryType } from '../components/CategoryHeader';
import { SmartDevice, DeviceType, DeviceCategory } from '../types';
import ApiService from '../services/ApiService';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { StorageService } from '../services/StorageService';
import { MaterialIcons } from '@expo/vector-icons';

interface HomeScreenProps {
  onDevicePress: (device: SmartDevice) => void;
  onCategoryPress: (category: DeviceCategory, room: CategoryType) => void;
  onLogout: () => void;
}

// Map device categories to DeviceType
const categoryToDeviceType: Record<DeviceCategory, DeviceType> = {
  'gates': DeviceType.GATE,
  'lights': DeviceType.LIGHT,
  'temperature': DeviceType.HEATING,
  'devices': DeviceType.DEVICES,
};

// Define which categories are available in each room
const roomCategories: Record<CategoryType, DeviceCategory[]> = {
  'all': ['gates', 'lights', 'temperature', 'devices'],
  'kitchen': ['lights', 'temperature', 'devices'], // No gates in kitchen
  'garden': ['gates', 'lights', 'devices'], // No temperature in garden
  'living-room': ['lights', 'temperature', 'devices'], // No gates in living room
  'bedroom': ['lights', 'temperature', 'devices'], // No gates in bedroom
  'bathroom': ['lights', 'temperature'], // No gates, no devices in bathroom
};

// Animated category card component
const AnimatedCategoryCard: React.FC<{
  category: { id: DeviceCategory; name: string; icon: keyof typeof MaterialIcons.glyphMap };
  index: number;
  onPress: () => void;
  colors: any;
}> = ({ category, index, onPress, colors }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
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

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        width: '48%',
        marginBottom: 16,
      }}
    >
      <TouchableOpacity
        style={[styles.categoryCard, { backgroundColor: colors.card }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name={category.icon}
          size={48}
          color={colors.textPrimary}
        />
        <Text
          style={[
            styles.categoryName,
            { color: colors.textPrimary, fontFamily: typography.fontFamily.semiBold },
          ]}
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ onDevicePress, onCategoryPress, onLogout }) => {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [username, setUsername] = useState('');

  useEffect(() => {
    loadUsername();
    setLoading(false);
  }, []);

  const loadUsername = async () => {
    const name = await StorageService.getUsername();
    setUsername(name || 'Użytkownik');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsername();
    setTimeout(() => setRefreshing(false), 500);
  };

  const availableCategories = roomCategories[selectedCategory] || roomCategories['all'];

  const categoryCards: { id: DeviceCategory; name: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { id: 'gates', name: 'Bramy/Rolety', icon: 'blinds' },
    { id: 'lights', name: 'Oświetlenie', icon: 'lightbulb' },
    { id: 'temperature', name: 'Temperatura', icon: 'thermostat' },
    { id: 'devices', name: 'Urządzenia', icon: 'devices' },
  ];

  const HeaderContent = (
    <View>
      <View style={styles.headerTopRow}>
        <View>
          <Text style={[styles.greeting, { color: '#FFFFFF', fontFamily: typography.fontFamily.bold }]}>
            Cześć, {username}!
          </Text>
          <Text style={[styles.subGreeting, { color: 'rgba(255, 255, 255, 0.8)', fontFamily: typography.fontFamily.medium }]}>
            Witaj w domu
          </Text>
        </View>
      </View>
      <CategoryHeader 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
    </View>
  );

  return (
    <SplitScreen 
      headerContent={HeaderContent}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Ładowanie...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.grid}>
              {categoryCards
                .filter(cat => availableCategories.includes(cat.id))
                .map((category, index) => (
                  <AnimatedCategoryCard
                    key={category.id}
                    category={category}
                    index={index}
                    onPress={() => onCategoryPress(category.id, selectedCategory)}
                    colors={colors}
                  />
                ))}
            </View>
          </>
        )}
      </ScrollView>
    </SplitScreen>
  );
};

const styles = StyleSheet.create({
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  greeting: {
    fontSize: 24,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100, // Space for bottom bar
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    borderRadius: 0,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    width: '100%',
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryName: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
  },
});

export default HomeScreen;

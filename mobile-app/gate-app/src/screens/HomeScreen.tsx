import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import SplitScreen from '../components/Layout/SplitScreen';
import CategoryHeader from '../components/CategoryHeader';
import { DeviceCategory } from '../types';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { StorageService } from '../services/StorageService';

interface HomeScreenProps {
  onCategoryPress: (category: DeviceCategory | 'all') => void;
  onLogout: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onCategoryPress, onLogout }) => {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory | 'all'>('all');
  const [username, setUsername] = useState('');

  useEffect(() => {
    loadUsername();
  }, []);

  useEffect(() => {
    // Automatically navigate to category when selected
    if (selectedCategory !== 'all') {
      onCategoryPress(selectedCategory);
    } else {
      // For 'all', navigate to category-devices screen to show all devices
      onCategoryPress('all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const loadUsername = async () => {
    const name = await StorageService.getUsername();
    setUsername(name || 'Użytkownik');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsername();
    setTimeout(() => setRefreshing(false), 500);
  };

  const HeaderContent = useMemo(() => (
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
  ), [username, selectedCategory]);

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
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
            Wybierz kategorię z góry, aby zobaczyć urządzenia
          </Text>
        </View>
      </ScrollView>
    </SplitScreen>
  );
};

const styles = StyleSheet.create({
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 15,
    marginBottom: 12, // Increased to center categories vertically
    paddingLeft: 30,
    paddingRight: 10,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
  },
});

export default HomeScreen;

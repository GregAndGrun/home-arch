import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';

export type TabRoute = 'home' | 'stats' | 'settings';

interface BottomTabBarProps {
  currentRoute: TabRoute;
  onNavigate: (route: TabRoute) => void;
}

const BottomTabBar: React.FC<BottomTabBarProps> = ({ currentRoute, onNavigate }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const tabs: { route: TabRoute; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { route: 'home', icon: 'home' },
    { route: 'stats', icon: 'bar-chart' },
    { route: 'settings', icon: 'settings' },
  ];

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.card, 
        borderTopColor: colors.border,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom + 8, 20) : Math.max(insets.bottom + 8, 20),
      }
    ]}>
      {tabs.map((tab) => {
        const isActive = currentRoute === tab.route;
        return (
          <TouchableOpacity
            key={tab.route}
            style={styles.tab}
            onPress={() => onNavigate(tab.route)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={tab.icon}
              size={28}
              color={isActive ? colors.accent : colors.textSecondary}
            />
            {isActive && (
              <View style={[styles.indicator, { backgroundColor: colors.accent }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: Platform.OS === 'ios' ? 60 : 56,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default BottomTabBar;


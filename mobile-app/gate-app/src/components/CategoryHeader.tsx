import React, { useRef, memo, useEffect } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { DeviceCategory } from '../types';

interface CategoryHeaderProps {
  selectedCategory: DeviceCategory | 'all';
  onSelectCategory: (category: DeviceCategory | 'all') => void;
}

const categories: { id: DeviceCategory | 'all'; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { id: 'all', label: 'Wszystkie', icon: 'dashboard' },
  { id: 'gates', label: 'Rolety', icon: 'blinds' },
  { id: 'lights', label: 'Oświetlenie', icon: 'lightbulb' },
  { id: 'temperature', label: 'Temperatura', icon: 'thermostat' },
  { id: 'devices', label: 'Urządzenia', icon: 'devices' },
];

// Animated category item component
const AnimatedCategoryItem: React.FC<{
  cat: { id: DeviceCategory | 'all'; label: string; icon: keyof typeof MaterialIcons.glyphMap };
  index: number;
  isSelected: boolean;
  onPress: () => void;
}> = ({ cat, index, isSelected, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{ transform: [{ scale: scaleAnim }] }}
    >
      <TouchableOpacity
        style={[
          styles.item,
          isSelected && { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name={cat.icon}
          size={22}
          color="#FFFFFF"
          style={{ opacity: isSelected ? 1 : 0.7, marginBottom: 2 }}
        />
        <Text
          style={[
            styles.label,
            { fontFamily: isSelected ? typography.fontFamily.bold : typography.fontFamily.medium },
            { opacity: isSelected ? 1 : 0.7 }
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {cat.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const CategoryHeader: React.FC<CategoryHeaderProps> = ({ selectedCategory, onSelectCategory }) => {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  // Start with opacity 1 to prevent flickering
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // Only animate on first mount, not on every render
    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        ref={scrollViewRef}
        key="category-scroll" // Stable key to prevent reset
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        removeClippedSubviews={false}
        collapsable={false}
      >
        {categories.map((cat, index) => (
          <AnimatedCategoryItem
            key={cat.id}
            cat={cat}
            index={index}
            isSelected={selectedCategory === cat.id}
            onPress={() => onSelectCategory(cat.id)}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12, // Increased to center categories vertically between title and bottom edge
  },
  scrollContent: {
    paddingLeft: 30,
    paddingRight: 10,
    gap: 8,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    flexDirection: 'column',
    gap: 4,
    minWidth: 80,
    maxWidth: 100,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default memo(CategoryHeader);

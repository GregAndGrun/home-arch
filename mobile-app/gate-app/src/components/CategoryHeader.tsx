import React, { useRef, memo, useEffect } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';

export type CategoryType = 'all' | 'kitchen' | 'garden' | 'living-room' | 'bedroom' | 'bathroom';

interface CategoryHeaderProps {
  selectedCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
}

const categories: { id: CategoryType; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { id: 'all', label: 'Wszystkie', icon: 'dashboard' },
  { id: 'kitchen', label: 'Kuchnia', icon: 'restaurant' },
  { id: 'garden', label: 'Ogród', icon: 'yard' },
  { id: 'living-room', label: 'Salon', icon: 'weekend' },
  { id: 'bedroom', label: 'Sypialnia', icon: 'bed' },
  { id: 'bathroom', label: 'Łazienka', icon: 'bathtub' },
];

// Animated category item component
const AnimatedCategoryItem: React.FC<{
  cat: { id: CategoryType; label: string; icon: keyof typeof MaterialIcons.glyphMap };
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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
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
    marginTop: 15,
  },
  scrollContent: {
    paddingLeft: 30,
    paddingRight: 10,
    gap: 12,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: 'column',
    gap: 4,
    minWidth: 75,
    maxWidth: 85,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});

export default memo(CategoryHeader);

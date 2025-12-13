import React, { useRef, memo, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { AppCategory } from '../screens/AppCategoriesScreen';

interface AppCategoryHeaderProps {
  selectedCategory: AppCategory | null;
  onSelectCategory: (category: AppCategory) => void;
}

const categories: { id: AppCategory; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { id: 'calendar', label: 'Kalendarz', icon: 'calendar-today' },
  { id: 'smart-home', label: 'Smart Home', icon: 'home' },
  { id: 'shopping-list', label: 'Zakupy', icon: 'shopping-cart' },
  { id: 'notes', label: 'Notatki', icon: 'note' },
];

// Animated category item component
const AnimatedCategoryItem: React.FC<{
  cat: { id: AppCategory; label: string; icon: keyof typeof MaterialIcons.glyphMap };
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

const AppCategoryHeader: React.FC<AppCategoryHeaderProps> = ({ selectedCategory, onSelectCategory }) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
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

export default memo(AppCategoryHeader);


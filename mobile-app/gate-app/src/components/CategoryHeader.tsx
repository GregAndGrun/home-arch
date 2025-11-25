import React, { useRef, memo } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
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

const CategoryHeader: React.FC<CategoryHeaderProps> = ({ selectedCategory, onSelectCategory }) => {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <View style={styles.container}>
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
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.item,
                isSelected && { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              ]}
              onPress={() => onSelectCategory(cat.id)}
            >
              <MaterialIcons
                name={cat.icon}
                size={24}
                color="#FFFFFF"
                style={{ opacity: isSelected ? 1 : 0.7 }}
              />
              <Text
                style={[
                  styles.label,
                  { fontFamily: isSelected ? typography.fontFamily.bold : typography.fontFamily.medium },
                  { opacity: isSelected ? 1 : 0.7 }
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  scrollContent: {
    paddingHorizontal: 10,
    gap: 12,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

export default memo(CategoryHeader);

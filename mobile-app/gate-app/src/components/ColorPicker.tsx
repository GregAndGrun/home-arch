import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, LayoutAnimation, Platform, UIManager, useWindowDimensions } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { MaterialIcons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

// Konwersja hex na RGB
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
};

// Konwersja RGB na HSV (Hue, Saturation, Value)
const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  let h = 0;

  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff + (g < b ? 6 : 0)) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
  }
  h /= 6;

  const s = max === 0 ? 0 : diff / max;
  const v = max;

  return [h * 360, s * 100, v * 100];
};

// 12 diverse Material Design colors (sorted by similarity - hue)
// Selected colors are clearly different from each other and well distributed in the spectrum
const ACCENT_COLORS = [
  { name: 'Red', value: '#F44336' },
  { name: 'Pink', value: '#EC407A' },
  { name: 'Orange', value: '#FF6B35' },
  { name: 'Yellow', value: '#FFC107' },
  { name: 'Green', value: '#4CAF50' },
  { name: 'Teal', value: '#009688' },
  { name: 'Cyan', value: '#00BCD4' },
  { name: 'Blue', value: '#2196F3' },
  { name: 'Indigo', value: '#3F51B5' },
  { name: 'Purple', value: '#AB47BC' },
  { name: 'Light Grey', value: '#9E9E9E' },
  { name: 'Dark Grey', value: '#616161' },
].sort((a, b) => {
  // Sort by hue in HSV, greys at the end
  const [hueA, satA] = rgbToHsv(...hexToRgb(a.value));
  const [hueB, satB] = rgbToHsv(...hexToRgb(b.value));
  
  // Grey colors (low saturation) sort at the end
  if (satA < 10 && satB >= 10) return 1;
  if (satA >= 10 && satB < 10) return -1;
  if (satA < 10 && satB < 10) {
    // For greys sort by brightness (value)
    const [, , valA] = rgbToHsv(...hexToRgb(a.value));
    const [, , valB] = rgbToHsv(...hexToRgb(b.value));
    return valB - valA; // Darker at the end
  }
  
  return hueA - hueB;
});

const COLOR_SIZE = 36;
const COLOR_MARGIN = 8;
const CONTAINER_PADDING = 32; // padding z SettingsScreen content (16 * 2)
const SECTION_PADDING = 32; // padding z SettingsScreen section (16 * 2)

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorSelect }) => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  // Zapamiętaj początkową kolejność kolorów (z wybranym na początku) - tylko raz przy montowaniu
  const sortedColorsRef = useRef<typeof ACCENT_COLORS>(ACCENT_COLORS);
  const [sortedColors, setSortedColors] = useState<typeof ACCENT_COLORS>(ACCENT_COLORS);

  // Oblicz ile kolorów mieści się w jednej linii
  const calculateColorsPerRow = () => {
    // Szerokość dostępna dla kolorów (ekran minus padding kontenera i sekcji)
    const availableWidth = screenWidth - CONTAINER_PADDING - SECTION_PADDING;
    // Szerokość jednego koloru z marginesem
    const colorWithMargin = COLOR_SIZE + COLOR_MARGIN;
    // Oblicz ile kolorów mieści się (zaokrąglij w dół)
    // Odejmij jeden margines, bo ostatni kolor nie ma marginesu z prawej
    const colorsPerRow = Math.floor((availableWidth + COLOR_MARGIN) / colorWithMargin);
    return Math.max(1, colorsPerRow); // Minimum 1 kolor
  };

  const colorsPerRow = calculateColorsPerRow();

  // Sortuj kolory tylko raz przy montowaniu komponentu
  useEffect(() => {
    const selectedIndex = ACCENT_COLORS.findIndex(c => c.value === selectedColor);
    if (selectedIndex === -1 || selectedIndex === 0) {
      sortedColorsRef.current = ACCENT_COLORS;
      setSortedColors(ACCENT_COLORS);
    } else {
      const selected = ACCENT_COLORS[selectedIndex];
      const others = ACCENT_COLORS.filter((_, i) => i !== selectedIndex);
      const sorted = [selected, ...others];
      sortedColorsRef.current = sorted;
      setSortedColors(sorted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Pusta tablica zależności - uruchamia się tylko raz

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  // Przed rozwinięciem: tylko kolory mieszczące się w jednej linii
  // Po rozwinięciu: wszystkie kolory
  const visibleColors = expanded ? sortedColors : sortedColors.slice(0, colorsPerRow);

  return (
    <View style={styles.container}>
      <View style={[styles.colorGrid, { flexWrap: expanded ? 'wrap' : 'nowrap' }]}>
        {visibleColors.map((color) => {
          const isSelected = color.value === selectedColor;
          return (
            <TouchableOpacity
              key={color.value}
              style={[
                styles.colorCircle,
                { backgroundColor: color.value },
                isSelected && styles.selectedCircle,
              ]}
              onPress={() => onColorSelect(color.value)}
              activeOpacity={0.7}
            >
              {isSelected && (
                <MaterialIcons name="check" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {sortedColors.length > colorsPerRow && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={toggleExpanded}
          activeOpacity={0.7}
        >
          <Text style={[styles.expandButtonText, { color: colors.accent, fontFamily: typography.fontFamily.medium }]}>
            {expanded ? 'Pokaż mniej' : 'Pokaż więcej'}
          </Text>
          <MaterialIcons
            name={expanded ? 'expand-less' : 'expand-more'}
            size={20}
            color={colors.accent}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCircle: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  expandButtonText: {
    fontSize: 14,
    marginRight: 4,
  },
});

export default ColorPicker;


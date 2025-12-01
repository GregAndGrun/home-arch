import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { MaterialIcons } from '@expo/vector-icons';

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

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorSelect }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.colorGrid}>
        {ACCENT_COLORS.map((color) => {
          const isSelected = color.value === selectedColor;
          return (
            <TouchableOpacity
              key={color.value}
              style={[
                styles.colorCircle,
                { backgroundColor: color.value },
                isSelected && styles.selectedCircle,
                styles.colorCircleMargin,
              ]}
              onPress={() => onColorSelect(color.value)}
              activeOpacity={0.7}
            >
              {isSelected && (
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  colorCircleMargin: {
    margin: 6,
  },
  selectedCircle: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});

export default ColorPicker;


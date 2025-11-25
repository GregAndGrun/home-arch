import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';

interface ThemeToggleProps {
  size?: number;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ size = 24 }) => {
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.button }]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <MaterialIcons
        name={theme === 'dark' ? 'light-mode' : 'dark-mode'}
        size={size}
        color={colors.textPrimary}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 0, // Kwadratowy
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ThemeToggle;


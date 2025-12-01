import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { StorageService } from '../services/StorageService';
import { generateColors, DEFAULT_ACCENT_COLOR, ThemeColors } from './colors';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  accentColor: string;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('dark'); // Domyślnie ciemny
  const [accentColor, setAccentColorState] = useState<string>(DEFAULT_ACCENT_COLOR);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      // Try to load saved theme and accent color from storage
      const savedSettings = await StorageService.getSettings();
      if (savedSettings?.theme) {
        setThemeState(savedSettings.theme as ThemeMode);
      } else {
        // Default to dark theme
        setThemeState('dark');
      }
      
      if (savedSettings?.accentColor) {
        setAccentColorState(savedSettings.accentColor);
      } else {
        setAccentColorState(DEFAULT_ACCENT_COLOR);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      setThemeState('dark');
      setAccentColorState(DEFAULT_ACCENT_COLOR);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      const settings = await StorageService.getSettings() || {};
      await StorageService.saveSettings({ ...settings, theme: newTheme });
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setAccentColor = async (color: string) => {
    setAccentColorState(color);
    try {
      const settings = await StorageService.getSettings() || {};
      await StorageService.saveSettings({ ...settings, accentColor: color });
    } catch (error) {
      console.error('Error saving accent color:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Generate colors with current accent color and theme
  const colors = useMemo(() => {
    return generateColors(accentColor, theme === 'dark');
  }, [accentColor, theme]);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ theme, colors, accentColor, toggleTheme, setTheme, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};


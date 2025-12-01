// Color definitions for Dark and Light themes

// Helper function to darken a color
const darkenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.floor((num >> 16) * (1 - percent)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent)));
  const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

// Helper function to lighten a color
const lightenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * percent));
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * percent));
  const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

// Default accent color
export const DEFAULT_ACCENT_COLOR = '#FF6B35';

// Generate colors with custom accent color
export const generateColors = (accentColor: string = DEFAULT_ACCENT_COLOR, isDark: boolean = true) => {
  const accentDark = darkenColor(accentColor, 0.15);
  const accentLight = lightenColor(accentColor, 0.2);

  if (isDark) {
    return {
      background: '#121212',
      card: '#1E1E1E',
      button: '#2A2A2A',
      buttonPressed: '#353535',
      textPrimary: '#FFFFFF',
      textSecondary: '#B0B0B0',
      accent: accentColor,
      accentDark: accentDark,
      accentLight: accentLight,
      border: '#2A2A2A',
      error: '#F44336',
      success: '#4CAF50',
      warning: '#FF9800',
      online: accentColor,
      offline: '#9E9E9E',
      header: '#1E1E1E',
    };
  } else {
    return {
      background: '#F5F5F5',
      card: '#FFFFFF',
      button: '#E0E0E0',
      buttonPressed: '#D0D0D0',
      textPrimary: '#212121',
      textSecondary: '#757575',
      accent: accentColor,
      accentDark: accentDark,
      accentLight: accentLight,
      border: '#E0E0E0',
      error: '#F44336',
      success: '#4CAF50',
      warning: '#FF9800',
      online: accentColor,
      offline: '#9E9E9E',
      header: '#FFFFFF',
    };
  }
};

// Legacy exports for backward compatibility
export const darkColors = generateColors(DEFAULT_ACCENT_COLOR, true);
export const lightColors = generateColors(DEFAULT_ACCENT_COLOR, false);

export type ThemeColors = ReturnType<typeof generateColors>;


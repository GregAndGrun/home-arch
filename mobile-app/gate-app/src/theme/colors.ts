// Color definitions for Dark and Light themes

export const darkColors = {
  background: '#121212',
  card: '#1E1E1E',
  button: '#2A2A2A',
  buttonPressed: '#353535',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  accent: '#FF6B35',
  accentDark: '#E55A2B',
  accentLight: '#FF8C5A',
  border: '#2A2A2A',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FF9800',
  online: '#FF6B35', // Pomarańczowy dla online status
  offline: '#9E9E9E',
  header: '#1E1E1E',
};

export const lightColors = {
  background: '#F5F5F5',
  card: '#FFFFFF',
  button: '#E0E0E0',
  buttonPressed: '#D0D0D0',
  textPrimary: '#212121',
  textSecondary: '#757575',
  accent: '#FF6B35',
  accentDark: '#E55A2B',
  accentLight: '#FF8C5A',
  border: '#E0E0E0',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FF9800',
  online: '#FF6B35', // Pomarańczowy dla online status
  offline: '#9E9E9E',
  header: '#FFFFFF',
};

export type ThemeColors = typeof darkColors;


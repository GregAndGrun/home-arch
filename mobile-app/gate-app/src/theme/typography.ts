// Typography definitions
import { Platform } from 'react-native';

export const typography = {
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto',
      web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      default: 'System',
    }),
    semiBold: Platform.select({
      ios: 'System',
      android: 'Roboto',
      web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto',
      web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      default: 'System',
    }),
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
};


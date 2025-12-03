import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'horizontal' | 'vertical';
  showSubtitle?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  variant = 'horizontal',
  showSubtitle = true 
}) => {
  const { colors } = useTheme();

  const sizeStyles = {
    small: { main: 14, sub: 7 },
    medium: { main: 20, sub: 9 },
    large: { main: 28, sub: 11 },
  };

  const currentSize = sizeStyles[size];

  // Use Sora/Inter font family matching original design
  const fontFamily = Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    web: 'Sora, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    default: 'System',
  });

  if (variant === 'vertical') {
    return (
      <View style={styles.verticalContainer}>
        <Text
          style={[
            styles.mainText,
            {
              fontSize: currentSize.main,
              color: '#FFFFFF',
              fontFamily: fontFamily,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 0.08 * currentSize.main,
            },
          ]}
        >
          GRUNERT
        </Text>
        {showSubtitle && (
          <Text
            style={[
              styles.subText,
              {
                fontSize: currentSize.sub,
                color: colors.textSecondary,
                fontFamily: fontFamily,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 0.08 * currentSize.sub,
              },
            ]}
          >
            DIGITAL PRODUCTS
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.horizontalContainer}>
      <Text
        style={[
          styles.mainText,
          {
            fontSize: currentSize.main,
            color: '#FFFFFF',
            fontFamily: fontFamily,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.08 * currentSize.main,
          },
        ]}
      >
        GRUNERT
      </Text>
      {showSubtitle && (
        <Text
          style={[
            styles.subText,
            {
              fontSize: currentSize.sub,
              color: colors.textSecondary,
              fontFamily: fontFamily,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 0.08 * currentSize.sub,
            },
          ]}
        >
          {' '}· DIGITAL PRODUCTS
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  verticalContainer: {
    alignItems: 'flex-start',
  },
  mainText: {
    // letterSpacing handled inline based on fontSize
  },
  subText: {
    marginTop: 2,
    // letterSpacing handled inline based on fontSize
  },
});

export default Logo;


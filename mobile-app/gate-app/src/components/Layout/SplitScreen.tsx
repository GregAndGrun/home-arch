import React, { useEffect, useRef, useMemo, memo } from 'react';
import { View, Text, StyleSheet, Platform, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/typography';
import { generateGradient } from '../../theme/colors';

interface SplitScreenProps {
  title?: string;
  titleIcon?: keyof typeof MaterialIcons.glyphMap;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
  onBack?: () => void;
}

const SplitScreen: React.FC<SplitScreenProps> = ({ title, titleIcon, headerContent, children, onBack }) => {
  const { colors, accentColor } = useTheme();
  const headerRef = useRef<View>(null);
  
  // Zapamiętaj gradient - nie przeliczaj przy każdym renderze
  const gradientColors = useMemo(() => {
    const [gradientStart, gradientEnd] = generateGradient(accentColor);
    return [gradientEnd, accentColor, gradientStart] as const;
  }, [accentColor]);

  // Animacje tylko dla contentu (nie dla headera!)
  // Start with opacity 1 to prevent flickering
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  
  // Animacja ikonki przy przełączaniu stron
  const iconScaleAnim = useRef(new Animated.Value(1)).current;
  const iconRotationAnim = useRef(new Animated.Value(0)).current;
  const iconOpacityAnim = useRef(new Animated.Value(1)).current;

  // Remove initial fade-in animation to prevent flickering
  // useEffect(() => {
  //   // Animacja tylko dla contentu
  //   Animated.timing(contentFadeAnim, {
  //     toValue: 1,
  //     duration: 300,
  //     delay: 200,
  //     useNativeDriver: true,
  //   }).start();
  // }, []);

  // Animacja ikonki przy zmianie titleIcon
  useEffect(() => {
    if (titleIcon) {
      // Reset animacji
      iconScaleAnim.setValue(0.7);
      iconRotationAnim.setValue(-0.3);
      iconOpacityAnim.setValue(0.3);
      
      // Animacja: mignięcie + scale + rotation
      Animated.parallel([
        Animated.timing(iconOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(iconRotationAnim, {
          toValue: 0,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [titleIcon]);

  const handleHeaderLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    // Wymuś stałą wysokość 240px jeśli się zmieniła
    if (headerRef.current && Math.abs(height - 240) > 0.5) {
      headerRef.current.setNativeProps({ style: { height: 240, minHeight: 240, maxHeight: 240 } });
    }
  };

  // Stały padding dla safe area (typowe wartości dla iOS/Android)
  const safeAreaTop = Platform.OS === 'ios' ? 44 : 24;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View 
        ref={headerRef}
        style={styles.headerContainer} 
        collapsable={false} 
        removeClippedSubviews={false}
        onLayout={handleHeaderLayout}
      >
        <LinearGradient
          colors={gradientColors} // Ciemny -> Średni -> Jasny
          locations={[0, 0.5, 1]} // Pozycje kolorów dla bardziej wyraźnego gradientu
          start={{ x: 0, y: 1 }} // Lewy dolny róg
          end={{ x: 1, y: 0 }} // Prawy górny róg
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.safeAreaContent, { paddingTop: safeAreaTop }]}>
          <View style={styles.headerContent}>
            {onBack && (
              <TouchableOpacity 
                onPress={onBack} 
                style={[styles.backButton, { top: safeAreaTop + 20 + 15 }]}
                activeOpacity={0.7}
              >
                <MaterialIcons name="chevron-left" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {title && (
              <View style={styles.titleContainer}>
                <View style={styles.titleWithIcon}>
                  {titleIcon && (
                    <Animated.View 
                      style={{ 
                        marginRight: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                        transform: [
                          { scale: iconScaleAnim },
                          { rotate: iconRotationAnim.interpolate({
                            inputRange: [-0.3, 0],
                            outputRange: ['-0.3rad', '0rad'],
                          })},
                        ],
                        opacity: iconOpacityAnim,
                      }}
                    >
                      <MaterialIcons name={titleIcon} size={32} color="#FFFFFF" />
                    </Animated.View>
                  )}
                  <Text 
                    style={[
                      styles.headerTitle, 
                      { 
                        fontFamily: typography.fontFamily.bold,
                        includeFontPadding: false,
                        textAlignVertical: 'center',
                      }
                    ]}
                  >
                    {title}
                  </Text>
                </View>
              </View>
            )}
            {headerContent && (
              <View style={styles.headerContentWrapper}>
                {headerContent}
              </View>
            )}
          </View>
        </View>
      </View>
      
      <Animated.View
        style={[
          styles.contentContainer,
          { backgroundColor: colors.background },
          { opacity: contentFadeAnim },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    height: 240, // Increased slightly (from 225)
    minHeight: 240,
    maxHeight: 240,
    width: '100%',
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  safeAreaContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    justifyContent: 'flex-start',
  },
  headerContent: {
    paddingTop: 20,
    height: 240, // Increased slightly (from 225)
    overflow: 'hidden',
  },
  headerContentWrapper: {
    minHeight: 160,
    overflow: 'visible',
    paddingHorizontal: 0,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 20,
    paddingVertical: 0,
    paddingHorizontal: 16,
    borderRadius: 0,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 50,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 20,
    minHeight: 40,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 36,
    height: 36,
  },
  headerPositionWrapper: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    marginTop: 240, // Increased slightly (from 225)
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
    paddingTop: 8,
  },
});

export default memo(SplitScreen);


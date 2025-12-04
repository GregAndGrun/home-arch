import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, Animated } from 'react-native';
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
}

const SplitScreen: React.FC<SplitScreenProps> = ({ title, titleIcon, headerContent, children }) => {
  const { colors, accentColor } = useTheme();
  const [gradientStart, gradientEnd] = generateGradient(accentColor);
  
  // Dodajemy kolor pośredni dla bardziej płynnego gradientu
  const gradientColors = [gradientEnd, accentColor, gradientStart];

  // Animacje
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animacja headera i contentu
    Animated.parallel([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 300,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={gradientColors} // Ciemny -> Średni -> Jasny
          locations={[0, 0.5, 1]} // Pozycje kolorów dla bardziej wyraźnego gradientu
          start={{ x: 0, y: 1 }} // Lewy dolny róg
          end={{ x: 1, y: 0 }} // Prawy górny róg
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeAreaContent}>
          <Animated.View 
            style={[
              styles.headerContent,
              { opacity: headerFadeAnim }
            ]}
          >
            {title && (
              <View style={styles.titleContainer}>
                {titleIcon && (
                  <Animated.View 
                    style={{ 
                      marginRight: 12,
                      opacity: headerFadeAnim,
                      transform: [{ scale: iconScaleAnim }],
                    }}
                  >
                    <MaterialIcons name={titleIcon} size={32} color="#FFFFFF" />
                  </Animated.View>
                )}
                <Animated.Text 
                  style={[
                    styles.headerTitle, 
                    { 
                      fontFamily: typography.fontFamily.bold,
                      opacity: headerFadeAnim,
                    }
                  ]}
                >
                  {title}
                </Animated.Text>
              </View>
            )}
            {headerContent}
          </Animated.View>
        </SafeAreaView>
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
    height: '35%',
    minHeight: 250,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    position: 'relative',
    overflow: 'hidden',
  },
  safeAreaContent: {
    position: 'relative',
    zIndex: 1,
    height: '100%',
    justifyContent: 'flex-start',
  },
  headerContent: {
    paddingTop: 20,
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
    paddingTop: 20,
  },
});

export default SplitScreen;


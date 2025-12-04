import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../theme/useTheme';

const HomeDecoration: React.FC = () => {
  const screenWidth = Dimensions.get('window').width;
  const decorationColor = '#FFFFFF';
  const lineWidth = 2;
  const opacity = 0.4;

  // Oblicz pozycje domków - rozłożone równomiernie
  const houseCount = 4;
  const houseSpacing = screenWidth / (houseCount + 1);

  return (
    <View style={styles.container}>
      {/* Płynna linia ciągnąca się przez całą szerokość */}
      <View style={styles.lineContainer}>
        <View style={[styles.curvedLine, { 
          borderTopColor: decorationColor,
          borderTopWidth: lineWidth,
          opacity,
        }]} />
      </View>
      
      {/* Symbole domów rozłożone na całej długości */}
      {Array.from({ length: houseCount }).map((_, index) => {
        const leftPosition = houseSpacing * (index + 1) - 15; // -15 to połowa szerokości domku
        return (
          <View key={index} style={[styles.houseSymbol, { left: leftPosition }]}>
            {/* Dach - trójkąt */}
            <View style={[styles.roofLine, { 
              borderBottomColor: decorationColor,
              borderBottomWidth: lineWidth,
              opacity,
            }]} />
            {/* Podstawa domu */}
            <View style={[styles.houseBase, { 
              borderColor: decorationColor,
              borderWidth: lineWidth,
              opacity,
            }]}>
              {/* Okno */}
              <View style={[styles.window, { 
                borderColor: decorationColor,
                borderWidth: lineWidth,
                opacity,
              }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  lineContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    height: 1,
  },
  curvedLine: {
    position: 'absolute',
    bottom: 0,
    left: -20,
    right: -20,
    height: 60,
    borderTopLeftRadius: 150,
    borderTopRightRadius: 150,
    borderTopWidth: 2,
  },
  houseSymbol: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roofLine: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1,
  },
  houseBase: {
    width: 24,
    height: 18,
    borderTopWidth: 0,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  window: {
    width: 8,
    height: 8,
    borderRadius: 1,
  },
});

export default HomeDecoration;


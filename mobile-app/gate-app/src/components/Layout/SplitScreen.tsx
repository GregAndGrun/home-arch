import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/typography';

interface SplitScreenProps {
  title?: string;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
}

const SplitScreen: React.FC<SplitScreenProps> = ({ title, headerContent, children }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerContainer, { backgroundColor: colors.accent }]}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            {title && (
              <Text style={[styles.headerTitle, { fontFamily: typography.fontFamily.bold }]}>
                {title}
              </Text>
            )}
            {headerContent}
          </View>
        </SafeAreaView>
      </View>
      
      <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    height: '35%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  headerContent: {
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    paddingTop: 20,
  },
});

export default SplitScreen;


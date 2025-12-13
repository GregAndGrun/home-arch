import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import SplitScreen from '../components/Layout/SplitScreen';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { MaterialIcons } from '@expo/vector-icons';

interface NotesScreenProps {
  onBack?: () => void;
}

const NotesScreen: React.FC<NotesScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();

  const HeaderContent = React.useMemo(() => {
    return (
      <View style={styles.headerTopRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Notatki
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Twoje notatki i zapiski
          </Text>
        </View>
      </View>
    );
  }, [colors]);

  return (
    <SplitScreen
      headerContent={HeaderContent}
      onBack={onBack}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={[styles.placeholderContainer, { backgroundColor: colors.card }]}>
          <MaterialIcons name="note" size={64} color={colors.textSecondary} />
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            Notatki wkrótce
          </Text>
          <Text style={[styles.placeholderSubtext, { color: colors.textSecondary }]}>
            Funkcjonalność notatek będzie dostępna w przyszłej wersji
          </Text>
        </View>
      </ScrollView>
    </SplitScreen>
  );
};

const styles = StyleSheet.create({
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 15,
    marginBottom: 12,
    paddingLeft: 30,
    paddingRight: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
  },
  placeholderText: {
    fontSize: 20,
    fontFamily: typography.fontFamily.semiBold,
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
});

export default NotesScreen;


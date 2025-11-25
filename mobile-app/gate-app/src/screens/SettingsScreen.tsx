import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { StorageService } from '../services/StorageService';
import ThemeToggle from '../components/ThemeToggle';
import SplitScreen from '../components/Layout/SplitScreen';
import { MaterialIcons } from '@expo/vector-icons';

interface SettingsScreenProps {
  onLogout: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onLogout }) => {
  const { colors } = useTheme();
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadUsername();
  }, []);

  const loadUsername = async () => {
    const storedUsername = await StorageService.getUsername();
    if (storedUsername) {
      setUsername(storedUsername);
    }
  };

  const handleSaveUsername = async () => {
    await StorageService.saveUsername(username);
    setIsEditing(false);
  };

  return (
    <SplitScreen title="Ustawienia">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.medium }]}>
            PROFIL UŻYTKOWNIKA
          </Text>
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Nazwa użytkownika</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Wpisz nazwę"
                  placeholderTextColor={colors.textSecondary}
                  autoFocus
                />
              ) : (
                <Text style={[styles.value, { color: colors.textSecondary }]}>
                  {username || 'Nie ustawiono'}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => isEditing ? handleSaveUsername() : setIsEditing(true)}
              style={styles.iconButton}
            >
              <MaterialIcons
                name={isEditing ? "check" : "edit"}
                size={24}
                color={colors.accent}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.medium }]}>
            WYGLĄD
          </Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Motyw aplikacji</Text>
            <ThemeToggle />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.medium }]}>
            KONTO
          </Text>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={onLogout}
          >
            <Text style={[styles.logoutText, { color: colors.error, fontFamily: typography.fontFamily.medium }]}>
              Wyloguj się
            </Text>
            <MaterialIcons name="logout" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SplitScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 16,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowContent: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
  },
  input: {
    fontSize: 16,
    borderBottomWidth: 1,
    paddingVertical: 4,
    marginRight: 16,
  },
  iconButton: {
    padding: 8,
  },
  logoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: 16,
  },
});

export default SettingsScreen;


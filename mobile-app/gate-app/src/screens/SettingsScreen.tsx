import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Linking, Platform, Animated } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { StorageService } from '../services/StorageService';
import ActivityService from '../services/ActivityService';
import ThemeToggle from '../components/ThemeToggle';
import ColorPicker from '../components/ColorPicker';
import SplitScreen from '../components/Layout/SplitScreen';
import Logo from '../components/Logo';
import { MaterialIcons } from '@expo/vector-icons';
import { Alert } from 'react-native';

interface SettingsScreenProps {
  onLogout: () => void;
}

// Animated section component
const AnimatedSection: React.FC<{
  index: number;
  children: React.ReactNode;
  backgroundColor: string;
}> = ({ index, children, backgroundColor }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View style={[styles.section, { backgroundColor }]}>
        {children}
      </View>
    </Animated.View>
  );
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onLogout }) => {
  const { colors, accentColor, setAccentColor } = useTheme();
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

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

  const handleClearActivityData = () => {
    Alert.alert(
      'Wyczyść dane aktywności',
      'Czy na pewno chcesz usunąć wszystkie zapisane dane aktywności urządzeń?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyczyść',
          style: 'destructive',
          onPress: async () => {
            try {
              await ActivityService.clearAllActivities();
              Alert.alert('Sukces', 'Dane aktywności zostały wyczyszczone');
            } catch (error) {
              Alert.alert('Błąd', 'Nie udało się wyczyścić danych aktywności');
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Błąd', 'Nowe hasła nie są identyczne');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Błąd', 'Hasło musi mieć co najmniej 6 znaków');
      return;
    }

    setChangingPassword(true);
    try {
      // TODO: Implement API endpoint for password change
      // For now, show message that feature requires firmware update
      Alert.alert(
        'Funkcja w przygotowaniu',
        'Zmiana hasła przez aplikację wymaga aktualizacji firmware. Obecnie hasło można zmienić tylko przez edycję pliku secrets.h i rekompilację firmware.',
        [{ text: 'OK' }]
      );
      setShowChangePassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Błąd', error.message || 'Nie udało się zmienić hasła');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleContactEmail = () => {
    Linking.openURL('mailto:kontakt@grunert.pl?subject=Kontakt z aplikacji Smart Home');
  };

  const handleContactWebsite = () => {
    Linking.openURL('https://www.grunert.pl');
  };

  const handleContactPhone = () => {
    Linking.openURL('tel:+48123456789');
  };

  return (
    <SplitScreen title="Ustawienia" titleIcon="settings">
      <ScrollView contentContainerStyle={styles.content}>
        <AnimatedSection index={0} backgroundColor={colors.card}>
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
        </AnimatedSection>

        <AnimatedSection index={1} backgroundColor={colors.card}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.medium }]}>
            WYGLĄD
          </Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Motyw aplikacji</Text>
            <ThemeToggle />
          </View>
          <View style={styles.colorPickerSection}>
            <Text style={[styles.label, { color: colors.textPrimary, marginBottom: 12 }]}>Kolor akcentu</Text>
            <ColorPicker selectedColor={accentColor} onColorSelect={setAccentColor} />
          </View>
        </AnimatedSection>

        <AnimatedSection index={2} backgroundColor={colors.card}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.medium }]}>
            DANE
          </Text>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={handleClearActivityData}
          >
            <Text style={[styles.logoutText, { color: colors.textSecondary, fontFamily: typography.fontFamily.medium }]}>
              Wyczyść dane aktywności
            </Text>
            <MaterialIcons name="delete-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </AnimatedSection>

        <AnimatedSection index={3} backgroundColor={colors.card}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.medium }]}>
            BEZPIECZEŃSTWO
          </Text>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={() => setShowChangePassword(!showChangePassword)}
          >
            <Text style={[styles.logoutText, { color: colors.textPrimary, fontFamily: typography.fontFamily.medium }]}>
              Zmień hasło
            </Text>
            <MaterialIcons 
              name={showChangePassword ? "expand-less" : "expand-more"} 
              size={24} 
              color={colors.textPrimary} 
            />
          </TouchableOpacity>
          
          {showChangePassword && (
            <View style={styles.passwordForm}>
              <TextInput
                style={[styles.passwordInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Stare hasło"
                placeholderTextColor={colors.textSecondary}
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.passwordInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Nowe hasło"
                placeholderTextColor={colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.passwordInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Potwierdź nowe hasło"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.changePasswordButton, { backgroundColor: colors.accent }]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                <Text style={[styles.changePasswordButtonText, { color: '#000', fontFamily: typography.fontFamily.bold }]}>
                  {changingPassword ? 'Zmienianie...' : 'Zmień hasło'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </AnimatedSection>

        <AnimatedSection index={4} backgroundColor={colors.card}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.medium }]}>
            KONTAKT
          </Text>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={handleContactEmail}
          >
            <View style={styles.contactInfo}>
              <MaterialIcons name="email" size={20} color={colors.accent} style={styles.contactIcon} />
              <Text style={[styles.logoutText, { color: colors.textPrimary, fontFamily: typography.fontFamily.medium }]}>
                kontakt@grunert.pl
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={handleContactWebsite}
          >
            <View style={styles.contactInfo}>
              <MaterialIcons name="language" size={20} color={colors.accent} style={styles.contactIcon} />
              <Text style={[styles.logoutText, { color: colors.textPrimary, fontFamily: typography.fontFamily.medium }]}>
                www.grunert.pl
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={handleContactPhone}
          >
            <View style={styles.contactInfo}>
              <MaterialIcons name="phone" size={20} color={colors.accent} style={styles.contactIcon} />
              <Text style={[styles.logoutText, { color: colors.textPrimary, fontFamily: typography.fontFamily.medium }]}>
                +48 XXX XXX XXX
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </AnimatedSection>

        <AnimatedSection index={5} backgroundColor={colors.card}>
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
        </AnimatedSection>
        
        <View style={styles.logoContainer}>
          <Logo size="medium" variant="vertical" />
        </View>
      </ScrollView>
    </SplitScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    borderRadius: 0,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
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
  colorPickerSection: {
    marginTop: 16,
  },
  passwordForm: {
    marginTop: 16,
    gap: 12,
  },
  passwordInput: {
    fontSize: 16,
    borderWidth: 1,
    padding: 12,
    borderRadius: 0,
  },
  changePasswordButton: {
    borderRadius: 0,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  changePasswordButtonText: {
    fontSize: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIcon: {
    marginRight: 12,
  },
});

export default SettingsScreen;


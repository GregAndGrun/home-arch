import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ApiService from '../services/ApiService';
import { BiometricsService } from '../services/BiometricsService';
import { StorageService } from '../services/StorageService';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { hexToRgba, generateGradient } from '../theme/colors';
import Logo from '../components/Logo';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { colors, accentColor } = useTheme();
  const [gradientStart, gradientEnd] = generateGradient(accentColor);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);

  const checkBiometrics = async () => {
    if (Platform.OS === 'web') {
      setBiometricsAvailable(false);
      return;
    }

    try {
      const available = await BiometricsService.isBiometricsAvailable();
      setBiometricsAvailable(available);
    } catch (error) {
      console.error('[LoginScreen] Error checking biometrics:', error);
      setBiometricsAvailable(false);
    }
  };

  const loadSavedCredentials = async () => {
    try {
      const credentials = await StorageService.getCredentials();
      if (credentials) {
        setUsername(credentials.username);
        setHasSavedCredentials(true);
        // Don't auto-fill password for security
      } else {
        setHasSavedCredentials(false);
      }
    } catch (error) {
      console.error('[LoginScreen] Error loading saved credentials:', error);
      setHasSavedCredentials(false);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Błąd', 'Wprowadź nazwę użytkownika i hasło');
      return;
    }

    setLoading(true);

    try {
      await ApiService.login(username, password);
      // Save credentials for biometric login
      await StorageService.saveCredentials(username, password);
      onLoginSuccess();
    } catch (error: any) {
      Alert.alert('Logowanie nieudane', error.message || 'Nieprawidłowe dane logowania');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = useCallback(async () => {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      const available = await BiometricsService.isBiometricsAvailable();
      if (!available) {
        return;
      }

      // First authenticate with biometrics
      const biometricSuccess = await BiometricsService.authenticate('Zaloguj się do Smart Home');
      
      if (!biometricSuccess) {
        return; // User cancelled or authentication failed
      }

      // Get saved credentials
      const credentials = await StorageService.getCredentials();
      
      if (!credentials) {
        // Nie pokazuj alertu przy automatycznym wywoływaniu
        return;
      }

      setLoading(true);

      try {
        await ApiService.login(credentials.username, credentials.password);
        onLoginSuccess();
      } catch (error: any) {
        Alert.alert('Logowanie nieudane', error.message || 'Nieprawidłowe dane logowania');
        // Clear invalid credentials
        await StorageService.clearCredentials();
      } finally {
        setLoading(false);
      }
    } catch (error) {
      // Silently ignore errors during automatic invocation
    }
  }, [onLoginSuccess]);

  useEffect(() => {
    const initialize = async () => {
      await checkBiometrics();
      await loadSavedCredentials();
    };
    initialize();
  }, []);

  // Ustaw showBiometricPrompt gdy biometria jest dostępna i są zapisane dane
  useEffect(() => {
    if (Platform.OS === 'web' || loading) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (biometricsAvailable && hasSavedCredentials) {
        setShowBiometricPrompt(true);
      } else {
        setShowBiometricPrompt(false);
      }
    }, 500); // Krótkie opóźnienie, aby stany się ustawiły

    return () => clearTimeout(timeoutId);
  }, [biometricsAvailable, hasSavedCredentials, loading]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark overlay for better text readability */}
        <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]} />
        
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
              Smart Home
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Control your smart home devices
            </Text>

            <View style={[styles.form, { 
              backgroundColor: 'rgba(30, 30, 30, 0.85)',
            }]}>
              {/* Opcje logowania biometrycznego - pokazuj na górze jeśli dostępne */}
              {showBiometricPrompt && !loading ? (
                <View style={styles.biometricOptions}>
                  <TouchableOpacity
                    style={styles.biometricButton}
                    onPress={handleBiometricLogin}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="fingerprint" size={48} color={accentColor} />
                    <Text style={[styles.biometricButtonText, { color: accentColor }]}>
                      Zaloguj odciskiem
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.usePasswordButton}
                    onPress={() => setShowBiometricPrompt(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.usePasswordButtonText, { color: colors.textSecondary }]}>
                      Użyj hasła
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                </View>
              ) : null}

              {/* Formularz logowania - zawsze widoczny */}
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: 'rgba(18, 18, 18, 0.6)',
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Username"
                placeholderTextColor={colors.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: 'rgba(18, 18, 18, 0.6)',
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: hexToRgba(accentColor, 0.5) },
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.buttonText, { 
                    color: '#FFFFFF', 
                    fontFamily: typography.fontFamily.bold,
                    fontWeight: '700',
                  }]}>
                    LOGIN
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Make sure you're connected to your home network
              </Text>
            </View>
            
            <View style={styles.logoContainer}>
              <Logo size="medium" variant="vertical" />
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 30,
    paddingTop: 60,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    borderRadius: 0,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  input: {
    borderRadius: 0,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    borderRadius: 0, // Kwadratowy
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 56,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  biometricOptions: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  biometricButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 12,
  },
  biometricButtonText: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  usePasswordButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  usePasswordButtonText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
});

export default LoginScreen;


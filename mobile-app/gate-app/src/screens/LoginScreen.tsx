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

  const checkBiometrics = async () => {
    if (Platform.OS === 'web') {
      setBiometricsAvailable(false);
      return;
    }

    const available = await BiometricsService.isBiometricsAvailable();
    setBiometricsAvailable(available);
  };

  const loadSavedCredentials = async () => {
    try {
      const credentials = await StorageService.getCredentials();
      if (credentials) {
        setUsername(credentials.username);
        // Don't auto-fill password for security
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
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
      // Cicho zignoruj błędy przy automatycznym wywoływaniu
      console.log('Biometric login error:', error);
    }
  }, [onLoginSuccess]);

  useEffect(() => {
    checkBiometrics();
    loadSavedCredentials();
    
    // Automatycznie wywołaj biometrię jeśli jest dostępna i są zapisane dane
    const timeoutId = setTimeout(() => {
      if (Platform.OS === 'web') {
        return;
      }

      StorageService.getCredentials().then((credentials) => {
        if (credentials && !loading) {
          // Automatycznie wywołaj biometrię tylko jeśli nie ma już trwającego logowania
          handleBiometricLogin();
        }
      }).catch(() => {
        // Cicho zignoruj błędy
      });
    }, 800); // Krótkie opóźnienie, aby UI się załadowało

    return () => clearTimeout(timeoutId);
  }, [handleBiometricLogin, loading]);

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

              <View style={[styles.buttonContainer, { backgroundColor: hexToRgba(gradientStart, 0.1) }]}>
                <View style={[styles.gradientOverlay, { backgroundColor: hexToRgba(gradientEnd, 0.08) }]} />
                <TouchableOpacity
                  style={[
                    styles.button,
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
  buttonContainer: {
    borderRadius: 0,
    marginTop: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  button: {
    borderRadius: 0, // Kwadratowy
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
});

export default LoginScreen;


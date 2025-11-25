import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BiometricsService } from '../services/BiometricsService';
import { StorageService } from '../services/StorageService';

interface BiometricLockScreenProps {
  onAuthenticated: () => void;
  onLogout?: () => void;
}

const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({ onAuthenticated, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [authType, setAuthType] = useState('');

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    // Skip biometrics in web browser - auto unlock
    if (Platform.OS === 'web') {
      setBiometricsAvailable(false);
      setLoading(false);
      // Auto unlock in web
      setTimeout(() => onAuthenticated(), 500);
      return;
    }

    const available = await BiometricsService.isBiometricsAvailable();
    setBiometricsAvailable(available);

    if (available) {
      const types = await BiometricsService.getSupportedAuthenticationTypes();
      setAuthType(BiometricsService.getAuthenticationTypeText(types));
      // Automatically trigger authentication
      await handleAuthenticate();
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearToken();
            if (onLogout) {
              onLogout();
            }
          },
        },
      ]
    );
  };

  const handleAuthenticate = async () => {
    const success = await BiometricsService.authenticate();

    if (success) {
      onAuthenticated();
    } else {
      Alert.alert(
        'Authentication Failed',
        'Please try again or use your device PIN',
        [
          {
            text: 'Try Again',
            onPress: handleAuthenticate,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>Smart Home</Text>
        <Text style={styles.subtitle}>
          {biometricsAvailable
            ? `Unlock with ${authType}`
            : 'Device authentication required'}
        </Text>

        {Platform.OS !== 'web' && (
          <TouchableOpacity
            style={styles.button}
            onPress={handleAuthenticate}
          >
            <Text style={styles.buttonText}>
              {biometricsAvailable ? 'Authenticate' : 'Unlock'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.infoText}>
          {Platform.OS === 'web' 
            ? 'Web browser detected - auto-unlocking...'
            : 'Your gates are protected by device authentication'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 80,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 0, // Kwadratowy
    paddingVertical: 15,
    paddingHorizontal: 50,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  logoutButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  logoutButtonText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default BiometricLockScreen;


import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus, Platform, Text } from 'react-native';
import { useFonts } from 'expo-font';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import GatesScreen from './src/screens/GatesScreen';
import GateDetailScreen from './src/screens/GateDetailScreen';
import CategoryDevicesScreen from './src/screens/CategoryDevicesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BiometricLockScreen from './src/screens/BiometricLockScreen';
import BottomTabBar, { TabRoute } from './src/components/Navigation/BottomTabBar';
import VpnStatusBanner from './src/components/VpnStatusBanner';
import { StorageService } from './src/services/StorageService';
import NotificationService from './src/services/NotificationService';
import { SmartDevice, GateType, DeviceCategory, CategoryType } from './src/types';
import { ThemeProvider } from './src/theme/ThemeContext';
import { useGatewayReachability } from './src/hooks/useGatewayReachability';

type Screen = 'home' | 'gates' | 'gate-detail' | 'settings' | 'category-devices';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [currentTab, setCurrentTab] = useState<TabRoute>('home');
  const [selectedGateType, setSelectedGateType] = useState<GateType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<CategoryType>('all');
  const { status: gatewayStatus, message: gatewayMessage, refresh: refreshGatewayStatus } =
    useGatewayReachability();

  useEffect(() => {
    checkAuthentication();
    
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      handleAppStateChange(nextAppState);
      if (nextAppState === 'active') {
        await checkAuthentication();
        // Immediately check gateway availability when app returns to foreground
        // This is especially useful after user activates VPN in WireGuard app
        refreshGatewayStatus();
      }
    });
    
    // Listen for token expiration events
    const handleTokenExpired = async () => {
      console.log('Token expired event received, logging out...');
      await handleLogout();
    };
    
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('token-expired', handleTokenExpired);
    }
    
    return () => {
      subscription.remove();
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('token-expired', handleTokenExpired);
      }
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const handleBeforeUnload = () => {
      if (StorageService.clearTokenSyncForWeb) {
        StorageService.clearTokenSyncForWeb();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Initialize notification service and listen for VPN notifications
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupNotifications = async () => {
      try {
        const initialized = await NotificationService.initialize();
        if (initialized) {
          // Subscribe to VPN notifications
          unsubscribe = NotificationService.subscribe((vpnNotification) => {
            console.log('VPN notification received:', vpnNotification);
            
            // If VPN is connected, immediately check gateway availability
            if (vpnNotification.type === 'connected') {
              console.log('VPN connected, checking gateway availability...');
              // Wait a moment for VPN to fully establish connection
              setTimeout(() => {
                refreshGatewayStatus();
              }, 1000); // 1 second delay to allow VPN to establish
            } else if (vpnNotification.type === 'disconnected') {
              console.log('VPN disconnected');
              // Optionally refresh to update status
              refreshGatewayStatus();
            }
          });
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [refreshGatewayStatus]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      setIsLocked(true);
    }
  };

  const checkAuthentication = async () => {
    try {
      const token = await StorageService.getToken();
      if (token) {
        // Verify token is still valid
        if (StorageService.isTokenValid(token)) {
          setIsAuthenticated(true);
        } else {
          // Token expired, logout
          console.log('Token expired during authentication check, logging out...');
          await handleLogout();
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (typeof window !== 'undefined') {
    (window as any).clearGateToken = async () => {
      await StorageService.clearToken();
      await checkAuthentication();
    };
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setIsLocked(false);
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setIsLocked(true);
    try {
      await StorageService.clearToken();
    } catch (error) {
      console.error('Error during logout:', error);
    }
    await checkAuthentication();
  };

  const handleBiometricUnlock = () => {
    setIsLocked(false);
  };

  const handleDevicePress = (device: SmartDevice) => {
    if (device.type === 'gate') {
      setCurrentScreen('gates');
    }
    // For other device types, could navigate to detail screens
  };

  const handleCategoryPress = (category: DeviceCategory, room: CategoryType) => {
    // For gates, go directly to GatesScreen instead of CategoryDevicesScreen
    if (category === 'gates') {
      setCurrentScreen('gates');
    } else {
      setSelectedCategory(category);
      setSelectedRoom(room);
      setCurrentScreen('category-devices');
    }
  };

  const handleGatePress = (gateType: GateType) => {
    setSelectedGateType(gateType);
    setCurrentScreen('gate-detail');
  };

  const handleBack = () => {
    if (currentScreen === 'gate-detail') {
      setCurrentScreen('gates');
      setSelectedGateType(null);
    } else if (currentScreen === 'gates') {
      setCurrentScreen('home');
    } else if (currentScreen === 'category-devices') {
      setCurrentScreen('home');
      setSelectedCategory(null);
      setSelectedRoom('all');
    }
  };

  const handleLogoutFromScreen = async () => {
    await handleLogout();
    setCurrentScreen('home');
    setCurrentTab('home');
    setSelectedGateType(null);
    setSelectedCategory(null);
    setSelectedRoom('all');
  };

  const handleTabNavigate = (route: TabRoute) => {
    setCurrentTab(route);
    if (route === 'home') {
      setCurrentScreen('home');
    } else if (route === 'settings') {
      setCurrentScreen('settings');
    }
    // Logic for other tabs (stats) can be added here
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (isAuthenticated && isLocked) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <BiometricLockScreen 
          onAuthenticated={handleBiometricUnlock}
          onLogout={handleLogout}
        />
      </View>
    );
  }

  const renderScreen = () => {
    if (currentTab === 'settings') {
      return (
        <SettingsScreen onLogout={handleLogoutFromScreen} />
      );
    }

    if (currentTab !== 'home') {
      // Placeholder for other tabs
      return (
        <View style={styles.placeholderContainer}>
          <Text>Tab: {currentTab} (Coming Soon)</Text>
        </View>
      );
    }

    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onDevicePress={handleDevicePress}
            onCategoryPress={handleCategoryPress}
            onLogout={handleLogoutFromScreen}
          />
        );
      case 'category-devices':
        return selectedCategory ? (
          <CategoryDevicesScreen
            category={selectedCategory}
            room={selectedRoom}
            onDevicePress={handleDevicePress}
            onBack={handleBack}
          />
        ) : null;
      case 'gates':
        return (
          <GatesScreen
            onGatePress={handleGatePress}
            onBack={handleBack}
          />
        );
      case 'gate-detail':
        return selectedGateType ? (
          <GateDetailScreen
            gateType={selectedGateType}
            onBack={handleBack}
          />
        ) : null;
      default:
        return (
          <HomeScreen
            onDevicePress={handleDevicePress}
            onCategoryPress={handleCategoryPress}
            onLogout={handleLogoutFromScreen}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <VpnStatusBanner
        status={gatewayStatus}
        message={gatewayMessage}
        onRetry={refreshGatewayStatus}
      />
      {isAuthenticated ? (
        <>
          <View style={styles.screenContainer}>
            {renderScreen()}
          </View>
          <BottomTabBar currentRoute={currentTab} onNavigate={handleTabNavigate} />
        </>
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus, Platform, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import ActivityService from './src/services/ActivityService';
import { SmartDevice, GateType, DeviceCategory, CategoryType } from './src/types';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { useGatewayReachability } from './src/hooks/useGatewayReachability';

type Screen = 'home' | 'gates' | 'gate-detail' | 'settings' | 'category-devices';

function AppContent() {
  const { colors } = useTheme();
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

  // Delay initial gateway check to avoid blocking app startup
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshGatewayStatus();
    }, 2000); // Wait 2 seconds after app starts before checking gateway
    
    return () => clearTimeout(timer);
  }, [refreshGatewayStatus]);

  useEffect(() => {
    // Safety timeout - always set loading to false after max 5 seconds
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('[App] Loading timeout - forcing app to continue');
        setIsLoading(false);
      }
    }, 5000);

    // Initialize ActivityService (database) in background - don't block app
    ActivityService.initialize()
      .then(() => {
        // Clean up old activities (older than 30 days) on startup
        ActivityService.clearOldActivities(30).catch(err => {
          console.warn('[App] Failed to clear old activities:', err);
        });
      })
      .catch(err => {
        console.warn('[App] ActivityService initialization failed (non-critical):', err);
      });

    checkAuthentication();
    
    let appStateSubscription: any = null;
    
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsLocked(true);
      } else if (nextAppState === 'active') {
        // Force re-render when app becomes active to prevent white screen
        setIsLoading(false);
        await checkAuthentication();
        // Immediately check gateway availability when app returns to foreground
        // This is especially useful after user activates VPN in WireGuard app
        refreshGatewayStatus();
      }
    };
    
    appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Listen for token expiration events
    const handleTokenExpired = async () => {
      await handleLogout();
    };
    
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('token-expired', handleTokenExpired);
    }
    
    return () => {
      clearTimeout(safetyTimeout);
      if (appStateSubscription) {
        appStateSubscription.remove();
      }
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
        // Add timeout to notification initialization to avoid blocking app
        const initPromise = NotificationService.initialize();
        const timeoutPromise = new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('Notification init timeout')), 5000)
        );
        
        const initialized = await Promise.race([initPromise, timeoutPromise]) as boolean;
        if (initialized) {
          // Subscribe to VPN notifications
          unsubscribe = NotificationService.subscribe((vpnNotification) => {
            // If VPN is connected, immediately check gateway availability
            if (vpnNotification.type === 'connected') {
              // Wait a moment for VPN to fully establish connection
              setTimeout(() => {
                refreshGatewayStatus();
              }, 1000); // 1 second delay to allow VPN to establish
            } else if (vpnNotification.type === 'disconnected') {
              refreshGatewayStatus();
            }
          });
        }
      } catch (error) {
        // Don't block app if notifications fail - just log and continue
        console.warn('[App] Notification service initialization failed (non-critical):', error);
      }
    };

    setupNotifications();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [refreshGatewayStatus]);

  // Removed - moved to useEffect to prevent stale closure issues

  const checkAuthentication = async () => {
    // Add timeout to prevent infinite loading
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.warn('[App] Authentication check timeout - continuing anyway');
        resolve();
      }, 3000); // 3 second timeout
    });

    try {
      const authPromise = (async () => {
        const token = await StorageService.getToken();
        
        if (token) {
          // Verify token is still valid
          if (StorageService.isTokenValid(token)) {
            setIsAuthenticated(true);
          } else {
            // Token expired, logout
            await handleLogout();
          }
        } else {
          setIsAuthenticated(false);
        }
      })();

      // Race between auth check and timeout
      await Promise.race([authPromise, timeoutPromise]);
    } catch (error) {
      console.error('[App] Error checking authentication:', error);
      setIsAuthenticated(false);
    } finally {
      // Always set loading to false, even if there was an error or timeout
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

  // Prevent white screen on app resume by ensuring state is properly initialized
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
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

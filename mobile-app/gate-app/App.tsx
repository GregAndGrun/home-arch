import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus, Platform, Text, Animated, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { useFonts } from 'expo-font'; // Not used - removed to prevent potential issues
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import GatesScreen from './src/screens/GatesScreen';
import GateDetailScreen from './src/screens/GateDetailScreen';
import CategoryDevicesScreen from './src/screens/CategoryDevicesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StatsScreen from './src/screens/StatsScreen';
import BiometricLockScreen from './src/screens/BiometricLockScreen';
import BottomTabBar, { TabRoute } from './src/components/Navigation/BottomTabBar';
import SwipeBackGesture from './src/components/Navigation/SwipeBackGesture';
// VpnStatusBanner removed from global App - now only shown on LoginScreen and GateDetailScreen (garage only)
import { StorageService } from './src/services/StorageService';
import NotificationService from './src/services/NotificationService';
import ActivityService from './src/services/ActivityService';
import { SmartDevice, GateType, DeviceCategory, DeviceType } from './src/types';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { useGatewayReachability } from './src/hooks/useGatewayReachability';

type Screen = 'home' | 'gate-detail' | 'settings' | 'category-devices';

function AppContent() {
  const { colors } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // Start unlocked - no login required
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginForAction, setShowLoginForAction] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [currentTab, setCurrentTab] = useState<TabRoute>('home');
  const [selectedGateType, setSelectedGateType] = useState<GateType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory | 'all' | null>(null);
  const [previousScreen, setPreviousScreen] = useState<Screen | null>(null);
  const [previousCategory, setPreviousCategory] = useState<DeviceCategory | 'all' | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [showAnimatedContent, setShowAnimatedContent] = useState(false);
  const { refresh: refreshGatewayStatus } = useGatewayReachability();
  
  // Refs for preventing state updates after unmount and debouncing
  const isMountedRef = useRef(true);
  const isInitialMountRef = useRef(true);
  const lockDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckInProgressRef = useRef(false);

  // Delay initial gateway check to avoid blocking app startup
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshGatewayStatus();
    }, 2000); // Wait 2 seconds after app starts before checking gateway
    
    return () => clearTimeout(timer);
  }, [refreshGatewayStatus]);

  useEffect(() => {
    isMountedRef.current = true;
    isInitialMountRef.current = true;

    // Safety timeout - always set loading to false after max 5 seconds
    const safetyTimeout = setTimeout(() => {
      if (isMountedRef.current && isLoading) {
        setIsLoading(false);
      }
    }, 5000);

    // Initialize ActivityService (database) in background - don't block app
    ActivityService.initialize()
      .then(() => {
        // Clean up old activities (older than 30 days) on startup
        ActivityService.clearOldActivities(30).catch(() => {
          // Silently fail - non-critical
        });
      })
      .catch(() => {
        // Silently fail - non-critical
      });

    // Initial authentication check
    checkAuthentication();
    
    let appStateSubscription: any = null;
    
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (!isMountedRef.current) return;

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Debounce lock setting to prevent rapid state changes
        if (lockDebounceTimerRef.current) {
          clearTimeout(lockDebounceTimerRef.current);
        }
        lockDebounceTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setIsLocked(true);
          }
        }, 300);
      } else if (nextAppState === 'active') {
        // Clear any pending lock
        if (lockDebounceTimerRef.current) {
          clearTimeout(lockDebounceTimerRef.current);
          lockDebounceTimerRef.current = null;
        }

        // Skip authentication check on initial mount (already done above)
        if (isInitialMountRef.current) {
          isInitialMountRef.current = false;
          return;
        }

        // Set loading to false first to ensure UI renders
        setIsLoading(false);
        
        // Debounce gateway check to prevent rapid calls
        setTimeout(() => {
          if (isMountedRef.current) {
            // Don't run full authentication check on resume to prevent race conditions/crashes
            // The token is verified on API calls anyway
            refreshGatewayStatus();
          }
        }, 500);
      }
    };
    
    appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Listen for token expiration events
    const handleTokenExpired = async () => {
      if (isMountedRef.current) {
        await handleLogout();
      }
    };
    
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('token-expired', handleTokenExpired);
    }
    
    return () => {
      isMountedRef.current = false;
      clearTimeout(safetyTimeout);
      if (lockDebounceTimerRef.current) {
        clearTimeout(lockDebounceTimerRef.current);
      }
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
    // No forced authentication check - app starts without login
    // Authentication will be checked only when ESP32 functions are used
    if (isMountedRef.current && isInitialMountRef.current) {
      setIsLoading(false);
      setIsAuthenticated(false);
      setIsLocked(false);
      isInitialMountRef.current = false;
    }
  };
  
  if (typeof window !== 'undefined') {
    (window as any).clearGateToken = async () => {
      await StorageService.clearToken();
      await checkAuthentication();
    };
  }

  const handleLoginSuccess = async () => {
    setIsAuthenticated(true);
    setIsLocked(false);
    setShowLoginForAction(false);
    
    // Execute pending action if exists (lazy auth)
    if (pendingAction) {
      try {
        await pendingAction();
      } catch (error) {
        console.error('[App] Failed to execute pending action:', error);
      }
      setPendingAction(null);
    }
    
    // Trigger animation
    setShowAnimatedContent(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handler for lazy authentication - when ESP32 function requires auth
  const handleAuthRequired = (action: () => Promise<void>) => {
    setPendingAction(() => action);
    setShowLoginForAction(true);
    setIsAuthenticated(false);
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setIsLocked(true);
    setShowAnimatedContent(false);
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
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
    // Don't handle disabled devices
    if (!device.enabled) {
      return;
    }
    
    // Save current screen and category before navigating
    setPreviousScreen(currentScreen);
    // Save the current selectedCategory (all categories now use category-devices screen)
    setPreviousCategory(selectedCategory);
    
    // Handle gates and blinds - navigate to appropriate gate detail screen
    if (device.type === DeviceType.GATE || device.type === DeviceType.BLINDS) {
      // Device ID is now GateType enum value
      setSelectedGateType(device.id as GateType);
      setCurrentScreen('gate-detail');
    }
    // For other device types, could navigate to detail screens
  };

  const handleCategoryPress = (category: DeviceCategory | 'all') => {
    // For all categories including 'gates', use CategoryDevicesScreen for consistency
    if (category === 'all') {
      setSelectedCategory('all');
    } else {
      setSelectedCategory(category);
    }
    setCurrentScreen('category-devices');
  };

  const handleGatePress = (gateType: GateType) => {
    // Save current screen and category before navigating
    setPreviousScreen(currentScreen);
    // Save the current selectedCategory (all categories now use category-devices screen)
    setPreviousCategory(selectedCategory || 'gates');
    
    setSelectedGateType(gateType);
    setCurrentScreen('gate-detail');
  };

  const handleBack = useCallback(() => {
    if (currentScreen === 'gate-detail') {
      // Return to previous screen/category if available
      if (previousScreen && previousScreen !== 'gate-detail') {
        setCurrentScreen(previousScreen);
        // Restore the previous category
        if (previousCategory !== null) {
          setSelectedCategory(previousCategory);
        }
        // Clear previous state
        setPreviousScreen(null);
        setPreviousCategory(null);
      } else {
        // Fallback to category-devices with previous category or 'all'
        setCurrentScreen('category-devices');
        setSelectedCategory(previousCategory || 'all');
        setPreviousScreen(null);
        setPreviousCategory(null);
      }
      setSelectedGateType(null);
    } else if (currentScreen === 'category-devices') {
      setCurrentScreen('home');
      setSelectedCategory(null);
    } else if (currentTab === 'settings') {
      setCurrentTab('home');
      setCurrentScreen('home');
    } else if (currentTab === 'stats') {
      setCurrentTab('home');
      setCurrentScreen('home');
    } else {
      return false; // Allow default back action (exit app)
    }
    return true; // Prevent default back action
  }, [currentScreen, currentTab, previousScreen, previousCategory]);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If login screen is shown, don't handle back button
      if (showLoginForAction) {
        return false; // Allow default behavior (close login)
      }

      // If locked (biometric screen), don't handle back button
      if (isAuthenticated && isLocked) {
        return false; // Allow default behavior
      }

      // If we're not on home screen, go back
      if (currentScreen !== 'home' || currentTab !== 'home') {
        handleBack();
        return true; // Prevent default behavior (closing app)
      }

      // If we're on home screen, allow default behavior (close app)
      return false;
    });

    return () => backHandler.remove();
  }, [currentScreen, currentTab, showLoginForAction, isAuthenticated, isLocked, handleBack]);

  const handleLogoutFromScreen = async () => {
    await handleLogout();
    setCurrentScreen('home');
    setCurrentTab('home');
    setSelectedGateType(null);
    setSelectedCategory(null);
  };

  const handleTabNavigate = (route: TabRoute) => {
    setCurrentTab(route);
    if (route === 'home') {
      setCurrentScreen('home');
    } else if (route === 'settings') {
      setCurrentScreen('settings');
    } else if (route === 'stats') {
      // Stats screen doesn't need screen state
    }
  };

  // Only show lock screen if user is authenticated (has token) and app is locked
  // If not authenticated, app works without lock
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

    if (currentTab === 'stats') {
      return <StatsScreen />;
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
          <Animated.View
            style={{
              flex: 1,
              opacity: showAnimatedContent ? fadeAnim : 1,
              transform: [{ translateY: showAnimatedContent ? slideAnim : 0 }],
            }}
          >
            <HomeScreen
              onCategoryPress={handleCategoryPress}
              onLogout={handleLogoutFromScreen}
            />
          </Animated.View>
        );
      case 'category-devices':
        return (
          <SwipeBackGesture onSwipeBack={handleBack} enabled={true}>
            <CategoryDevicesScreen
              category={selectedCategory || 'all'}
              onDevicePress={handleDevicePress}
              onCategorySelect={(category) => {
                if (category === 'all') {
                  setSelectedCategory('all');
                } else {
                  setSelectedCategory(category as DeviceCategory);
                }
                // Stay on category-devices screen for all categories
              }}
            />
          </SwipeBackGesture>
        );
      // Removed 'gates' case - now using CategoryDevicesScreen for all categories
      case 'gate-detail':
        return selectedGateType ? (
          <SwipeBackGesture onSwipeBack={handleBack} enabled={true}>
            <GateDetailScreen
              gateType={selectedGateType}
              onBack={handleBack}
              onAuthRequired={handleAuthRequired}
            />
          </SwipeBackGesture>
        ) : null;
      default:
        return (
          <HomeScreen
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
      {showLoginForAction ? (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          <View style={styles.screenContainer}>
            {renderScreen()}
          </View>
          <BottomTabBar currentRoute={currentTab} onNavigate={handleTabNavigate} />
        </>
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

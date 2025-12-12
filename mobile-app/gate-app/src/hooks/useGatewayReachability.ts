import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import ApiService from '../services/ApiService';

export type GatewayStatus = 'checking' | 'online' | 'vpn-required' | 'offline';

const CHECK_INTERVAL_ACTIVE_MS = 15000; // 15 seconds when app is active
const CHECK_INTERVAL_BACKGROUND_MS = 60000; // 60 seconds when app is in background

const OFFLINE_MESSAGE = 'Brak połączenia z internetem. Sprawdź Wi‑Fi lub dane komórkowe.';
const VPN_MESSAGE = 'Brama jest poza zasięgiem. Włącz VPN lub połącz się z siecią domową.';

export const useGatewayReachability = () => {
  const [status, setStatus] = useState<GatewayStatus>('checking');
  const [message, setMessage] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<number | null>(null);

  const netInfoRef = useRef<NetInfoState | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCheckingRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const clearIntervalRef = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const setOffline = useCallback(() => {
    setStatus('offline');
    setMessage(OFFLINE_MESSAGE);
  }, []);

  const performCheck = useCallback(async () => {
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;
    try {
      const connection = netInfoRef.current || (await NetInfo.fetch());

      if (!connection?.isConnected) {
        setOffline();
        setLastChecked(Date.now());
        return;
      }

      // Health check should not require authentication - it's public endpoint
      // Use short timeout to avoid blocking app
      await ApiService.checkHealth();
      setStatus('online');
      setMessage(null);
    } catch (error) {
      // ESP32 unavailable - set status but don't force login
      // App should work without ESP32 (for Sonoff devices)
      setStatus('vpn-required');
      if (error instanceof Error && error.message && !error.message.includes('No response')) {
        setMessage(error.message);
      } else {
        setMessage(VPN_MESSAGE);
      }
    } finally {
      setLastChecked(Date.now());
      isCheckingRef.current = false;
    }
  }, [setOffline]);

  const refresh = useCallback(() => {
    setStatus('checking');
    setMessage(null);
    performCheck();
  }, [performCheck]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      netInfoRef.current = state;
      if (!state.isConnected) {
        setOffline();
      } else {
        setStatus((prev) => (prev === 'online' ? prev : 'checking'));
        setMessage(null);
        performCheck();
      }
    });

    // Initial fetch - don't check gateway immediately to avoid blocking app startup
    // Gateway check will be triggered manually after app loads
    NetInfo.fetch().then((state) => {
      netInfoRef.current = state;
      if (!state.isConnected) {
        setOffline();
      } else {
        // Don't perform check immediately - wait for manual trigger
        setStatus('checking');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [performCheck, setOffline]);

  // Handle AppState changes for adaptive checking
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      appStateRef.current = nextAppState;
      
      // Clear existing interval
      clearIntervalRef();
      
      // Set new interval based on app state
      if (nextAppState === 'active') {
        // App is active - check more frequently
        intervalRef.current = setInterval(() => {
          performCheck();
        }, CHECK_INTERVAL_ACTIVE_MS);
      } else {
        // App is in background - check less frequently
        intervalRef.current = setInterval(() => {
          performCheck();
        }, CHECK_INTERVAL_BACKGROUND_MS);
      }
    });

    // Set initial interval based on current app state
    clearIntervalRef();
    if (appStateRef.current === 'active') {
      intervalRef.current = setInterval(() => {
        performCheck();
      }, CHECK_INTERVAL_ACTIVE_MS);
    } else {
      intervalRef.current = setInterval(() => {
        performCheck();
      }, CHECK_INTERVAL_BACKGROUND_MS);
    }

    return () => {
      subscription.remove();
      clearIntervalRef();
    };
  }, [performCheck]);

  return {
    status,
    message,
    lastChecked,
    refresh,
  };
};



import { useCallback, useEffect, useRef, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import ApiService from '../services/ApiService';

export type GatewayStatus = 'checking' | 'online' | 'vpn-required' | 'offline';

const CHECK_INTERVAL_MS = 15000;

const OFFLINE_MESSAGE = 'Brak połączenia z internetem. Sprawdź Wi‑Fi lub dane komórkowe.';
const VPN_MESSAGE = 'Brama jest poza zasięgiem. Włącz VPN lub połącz się z siecią domową.';

export const useGatewayReachability = () => {
  const [status, setStatus] = useState<GatewayStatus>('checking');
  const [message, setMessage] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<number | null>(null);

  const netInfoRef = useRef<NetInfoState | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCheckingRef = useRef(false);

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

      await ApiService.checkHealth();
      setStatus('online');
      setMessage(null);
    } catch (error) {
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

    // Initial fetch
    NetInfo.fetch().then((state) => {
      netInfoRef.current = state;
      if (!state.isConnected) {
        setOffline();
      } else {
        performCheck();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [performCheck, setOffline]);

  useEffect(() => {
    clearIntervalRef();
    intervalRef.current = setInterval(() => {
      performCheck();
    }, CHECK_INTERVAL_MS);

    return () => {
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



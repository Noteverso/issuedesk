/**
 * useNetworkStatus Hook
 * Monitors network connectivity and provides online/offline status
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  isLoading: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    connectionType: null,
    isLoading: true,
  });

  const updateStatus = useCallback((state: NetInfoState) => {
    setStatus({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then(updateStatus);

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(updateStatus);

    return () => {
      unsubscribe();
    };
  }, [updateStatus]);

  return status;
}

/**
 * Offline Indicator Component
 * Feature: 002-github-app-auth
 * Task: T070d - Show offline mode indicator
 * 
 * Displays a banner when backend is unreachable, indicating read-only mode.
 */

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import type { ConnectivityStatusEvent } from '@issuedesk/shared';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Listen for connectivity status changes
    const handleConnectivityChange = (event: ConnectivityStatusEvent) => {
      console.log('[OfflineIndicator] Connectivity status:', event.isOnline ? 'online' : 'offline');
      setIsOnline(event.isOnline);
    };

    const unsubscribe = window.electronAPI.on('connectivity:status-changed', handleConnectivityChange);

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  if (isOnline) {
    return null; // Don't show anything when online
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
      <div className="flex items-center justify-center gap-2 text-sm text-yellow-800">
        <WifiOff className="w-4 h-4" />
        <span className="font-medium">Limited connectivity</span>
        <span className="text-yellow-700">
          - Read-only mode. Changes will sync when connection is restored.
        </span>
      </div>
    </div>
  );
}

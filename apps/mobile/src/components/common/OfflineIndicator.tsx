/**
 * OfflineIndicator Component
 * Banner showing when the app is offline
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface OfflineIndicatorProps {
  onRetry?: () => void;
}

export function OfflineIndicator({ onRetry }: OfflineIndicatorProps) {
  const { theme } = useTheme();
  const { isConnected, isInternetReachable, isLoading } = useNetworkStatus();

  // Don't show while loading or when connected
  if (isLoading || (isConnected && isInternetReachable !== false)) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.warning,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    icon: {
      fontSize: theme.fontSize.md,
    },
    text: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.sm,
      fontWeight: '500',
    },
    retryButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      marginLeft: theme.spacing.sm,
    },
    retryText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.sm,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📶</Text>
      <Text style={styles.text}>You're offline</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

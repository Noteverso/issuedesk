/**
 * LoadingSpinner Component
 * Centered loading indicator with optional message
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export function LoadingSpinner({
  message,
  size = 'large',
  fullScreen = true,
}: LoadingSpinnerProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: fullScreen ? 1 : undefined,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
      backgroundColor: fullScreen ? theme.colors.background : 'transparent',
    },
    message: {
      marginTop: theme.spacing.md,
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

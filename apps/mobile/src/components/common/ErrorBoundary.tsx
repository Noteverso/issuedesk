/**
 * ErrorBoundary Component
 * Catches React errors and displays fallback UI with retry option
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { lightTheme, Theme } from '../../styles/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          theme={lightTheme}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
  theme: Theme;
}

function ErrorFallback({ error, onRetry, theme }: ErrorFallbackProps) {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.background,
    },
    icon: {
      fontSize: 64,
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: theme.fontSize.xl,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    message: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    errorDetail: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
      fontFamily: 'monospace',
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.md,
    },
    retryText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.md,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>
        An unexpected error occurred. Please try again.
      </Text>
      {error && (
        <Text style={styles.errorDetail} numberOfLines={3}>
          {error.message}
        </Text>
      )}
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Login screen with "Login with GitHub" button
 * Implements FR-001
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { startDeviceFlow } from '../../api/auth';
import type { AuthStackParamList } from '../../types';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const deviceAuth = await startDeviceFlow();
      navigation.navigate('DeviceCode', {
        deviceCode: deviceAuth.deviceCode,
        userCode: deviceAuth.userCode,
        verificationUri: deviceAuth.verificationUri,
      });
    } catch (err) {
      setError('Failed to start login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.logo, { color: theme.colors.text }]}>📱</Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>IssueDesk</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Manage GitHub Issues on the go
          </Text>
        </View>

        <View style={styles.actions}>
          {error && (
            <View style={[styles.errorBox, { backgroundColor: theme.colors.danger + '20' }]}>
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: theme.colors.text },
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.background} />
            ) : (
              <>
                <Text style={styles.githubIcon}>🐙</Text>
                <Text style={[styles.loginButtonText, { color: theme.colors.background }]}>
                  Login with GitHub
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.note, { color: theme.colors.textTertiary }]}>
            Uses GitHub's secure device flow authentication
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  actions: {
    gap: 16,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 12,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  githubIcon: {
    fontSize: 24,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});

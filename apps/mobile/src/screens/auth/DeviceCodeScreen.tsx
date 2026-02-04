/**
 * Device code screen showing code and copy button
 * Implements FR-002, FR-003, FR-005
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { copyUserCode, openAuthorizationPage, pollDeviceFlow } from '../../api/auth';
import type { AuthStackParamList } from '../../types';

type DeviceCodeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'DeviceCode'>;
type DeviceCodeScreenRouteProp = RouteProp<AuthStackParamList, 'DeviceCode'>;

const DEVICE_CODE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const POLL_INTERVAL_MS = 5000;

export default function DeviceCodeScreen() {
  const navigation = useNavigation<DeviceCodeScreenNavigationProp>();
  const route = useRoute<DeviceCodeScreenRouteProp>();
  const { theme } = useTheme();
  const { login } = useAuth();

  const { deviceCode, userCode, verificationUri } = route.params;
  const [copied, setCopied] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(DEVICE_CODE_TIMEOUT_MS);
  const pollingRef = useRef(false);
  const expiresAtRef = useRef(Date.now() + DEVICE_CODE_TIMEOUT_MS);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = expiresAtRef.current - Date.now();
      if (remaining <= 0) {
        setError('Authorization timeout. Please try again.');
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCopy = async () => {
    await copyUserCode(userCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGitHub = async () => {
    await openAuthorizationPage(verificationUri);
    startPolling();
  };

  const startPolling = async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    setIsPolling(true);
    setError(null);

    try {
      const result = await pollDeviceFlow(
        deviceCode,
        expiresAtRef.current,
        POLL_INTERVAL_MS
      );

      if (result.installations.length === 0) {
        navigation.replace('InstallApp');
        return;
      }

      await login(result.user, result.installations);
      navigation.replace('RepositorySelect', { isInitial: true });
    } catch (err) {
      pollingRef.current = false;
      setIsPolling(false);
      console.log(err)

      if (err instanceof Error) {
        if (err.message === 'DEVICE_CODE_TIMEOUT' || err.message === 'DEVICE_CODE_EXPIRED') {
          setError('Authorization timeout. Please try again.');
        } else if (err.message === 'ACCESS_DENIED') {
          setError('Authorization was denied. Please try again.');
        } else {
          setError('Authentication failed. Please try again.');
        }
      }
    }
  };

  const handleRetry = () => {
    navigation.replace('Login');
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.codeSection}>
          <Text style={[styles.instruction, { color: theme.colors.textSecondary }]}>
            Enter this code on GitHub:
          </Text>

          <View style={[styles.codeBox, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
            <Text style={[styles.code, { color: theme.colors.text }]}>{userCode}</Text>
          </View>

          <TouchableOpacity
            style={[styles.copyButton, { borderColor: theme.colors.border }]}
            onPress={handleCopy}
          >
            <Text style={[styles.copyButtonText, { color: theme.colors.primary }]}>
              {copied ? '✓ Copied!' : '📋 Copy Code'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          {error ? (
            <>
              <View style={[styles.errorBox, { backgroundColor: theme.colors.danger + '20' }]}>
                <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleRetry}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleOpenGitHub}
                disabled={isPolling}
              >
                <Text style={styles.primaryButtonText}>
                  {isPolling ? 'Waiting for authorization...' : 'Open GitHub'}
                </Text>
              </TouchableOpacity>

              {isPolling && (
                <View style={styles.pollingIndicator}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={[styles.pollingText, { color: theme.colors.textSecondary }]}>
                    Complete authorization in your browser
                  </Text>
                </View>
              )}

              <Text style={[styles.timer, { color: theme.colors.textTertiary }]}>
                Code expires in {formatTime(timeLeft)}
              </Text>
            </>
          )}
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
  codeSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  instruction: {
    fontSize: 16,
    marginBottom: 16,
  },
  codeBox: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  code: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
  copyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    gap: 16,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  pollingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pollingText: {
    fontSize: 14,
  },
  timer: {
    fontSize: 14,
    textAlign: 'center',
  },
});

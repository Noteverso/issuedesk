/**
 * Install App screen for users without GitHub App installation
 * Implements FR-006
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import type { AuthStackParamList } from '../../types';

const GITHUB_APP_URL = 'https://github.com/apps/issuedesk';

type InstallAppScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'InstallApp'>;

export default function InstallAppScreen() {
  const navigation = useNavigation<InstallAppScreenNavigationProp>();
  const { theme } = useTheme();

  const handleInstall = async () => {
    await Linking.openURL(GITHUB_APP_URL);
  };

  const handleRetry = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>🔧</Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Install GitHub App
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            To use IssueDesk Mobile, you need to install the IssueDesk GitHub App on your account or organization.
          </Text>
        </View>

        <View style={styles.steps}>
          <View style={styles.step}>
            <Text style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>1</Text>
            <Text style={[styles.stepText, { color: theme.colors.text }]}>
              Click the button below to open GitHub
            </Text>
          </View>
          <View style={styles.step}>
            <Text style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>2</Text>
            <Text style={[styles.stepText, { color: theme.colors.text }]}>
              Install the IssueDesk app on your account
            </Text>
          </View>
          <View style={styles.step}>
            <Text style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>3</Text>
            <Text style={[styles.stepText, { color: theme.colors.text }]}>
              Return here and log in again
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleInstall}
          >
            <Text style={styles.primaryButtonText}>Install GitHub App</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
            onPress={handleRetry}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
              I've installed it, log in again
            </Text>
          </TouchableOpacity>
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
    marginBottom: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  steps: {
    marginBottom: 32,
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
    overflow: 'hidden',
  },
  stepText: {
    fontSize: 16,
    flex: 1,
  },
  actions: {
    gap: 12,
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
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

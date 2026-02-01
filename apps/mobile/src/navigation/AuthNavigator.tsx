/**
 * Auth navigator for login flow
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';

// Import screens (will be created in Phase 3)
import LoginScreen from '../screens/auth/LoginScreen';
import DeviceCodeScreen from '../screens/auth/DeviceCodeScreen';
import InstallAppScreen from '../screens/auth/InstallAppScreen';
import RepositorySelectScreen from '../screens/settings/RepositorySelectScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DeviceCode"
        component={DeviceCodeScreen}
        options={{ title: 'Enter Code' }}
      />
      <Stack.Screen
        name="InstallApp"
        component={InstallAppScreen}
        options={{ title: 'Install GitHub App' }}
      />
      <Stack.Screen
        name="RepositorySelect"
        component={RepositorySelectScreen}
        options={{ title: 'Select Repository' }}
      />
    </Stack.Navigator>
  );
}

/**
 * Root app navigator with conditional auth routing
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRepository } from '../contexts/RepositoryContext';
import { useTheme } from '../contexts/ThemeContext';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { isLoading: repoLoading, repository } = useRepository();
  const { theme } = useTheme();

  // Show loading screen while checking auth status
  if (authLoading || repoLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Determine which navigator to show
  const showAuth = !isAuthenticated;
  const showRepoSelect = isAuthenticated && !repository;

  return (
    <NavigationContainer
      theme={{
        dark: theme.mode === 'dark',
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.backgroundSecondary,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.danger,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showAuth ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : showRepoSelect ? (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            initialParams={{ screen: 'RepositorySelect', params: { isInitial: true } }}
          />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

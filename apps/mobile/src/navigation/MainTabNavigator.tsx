/**
 * Main tab navigator with bottom tabs
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import type { MainTabParamList, IssuesStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useRepository } from '../contexts/RepositoryContext';

// Import screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import IssueListScreen from '../screens/issues/IssueListScreen';
import IssueDetailScreen from '../screens/issues/IssueDetailScreen';
import CreateIssueScreen from '../screens/issues/CreateIssueScreen';
import EditIssueScreen from '../screens/issues/EditIssueScreen';
import LabelsScreen from '../screens/labels/LabelsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import R2SettingsScreen from '../screens/settings/R2SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const IssuesStack = createNativeStackNavigator<IssuesStackParamList>();
const SettingsStack = createNativeStackNavigator();

function IssuesNavigator() {
  const { theme } = useTheme();

  return (
    <IssuesStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <IssuesStack.Screen
        name="IssueList"
        component={IssueListScreen}
        options={{ title: 'Issues' }}
      />
      <IssuesStack.Screen
        name="IssueDetail"
        component={IssueDetailScreen}
        options={{ title: 'Issue' }}
      />
      <IssuesStack.Screen
        name="CreateIssue"
        component={CreateIssueScreen}
        options={{ title: 'New Issue' }}
      />
      <IssuesStack.Screen
        name="EditIssue"
        component={EditIssueScreen}
        options={{ title: 'Edit Issue' }}
      />
    </IssuesStack.Navigator>
  );
}

function SettingsNavigator() {
  const { theme } = useTheme();

  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <SettingsStack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <SettingsStack.Screen
        name="R2Settings"
        component={R2SettingsScreen}
        options={{ title: 'R2 Configuration' }}
      />
    </SettingsStack.Navigator>
  );
}

// Simple tab icon component (emoji-based for now)
function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const icons: Record<string, string> = {
    Dashboard: '📊',
    Issues: '📝',
    Labels: '🏷️',
    Settings: '⚙️',
  };
  return (
    <Text style={{ fontSize: focused ? 26 : 24, opacity: focused ? 1 : 0.7 }}>
      {icons[name] || '•'}
    </Text>
  );
}

export function MainTabNavigator() {
  const { theme } = useTheme();
  const { repository } = useRepository();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerTitle: repository?.fullName || 'IssueDesk',
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Issues"
        component={IssuesNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Labels"
        component={LabelsScreen}
        options={{ title: 'Labels' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

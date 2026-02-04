/**
 * Settings screen
 * Implements FR-033, FR-035, FR-036
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRepository } from '../../contexts/RepositoryContext';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { theme, themePreference, setThemePreference, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { repository, clearRepository } = useRepository();

  const handleThemeToggle = async (value: boolean) => {
    await setThemePreference(value ? 'dark' : 'light');
  };

  const handleChangeRepository = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Auth',
        params: {
          screen: 'RepositorySelect',
          params: { isInitial: false },
        },
      })
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearRepository();
            await logout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          ACCOUNT
        </Text>
        <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.colors.text }]}>Logged in as</Text>
            <Text style={[styles.rowValue, { color: theme.colors.textSecondary }]}>
              {user?.username || 'Unknown'}
            </Text>
          </View>
        </View>
      </View>

      {/* Repository Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          REPOSITORY
        </Text>
        <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.colors.text }]}>Current repository</Text>
            <Text style={[styles.rowValue, { color: theme.colors.textSecondary }]}>
              {repository?.fullName || 'None'}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <TouchableOpacity style={styles.actionRow} onPress={handleChangeRepository}>
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>
              Change Repository
            </Text>
            <Text style={[styles.chevron, { color: theme.colors.textTertiary }]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          APPEARANCE
        </Text>
        <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.colors.text }]}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={handleThemeToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>
        </View>
      </View>

      {/* R2 Storage Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          IMAGE STORAGE
        </Text>
        <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('R2Settings' as never)}
          >
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                Cloudflare R2 Configuration
              </Text>
              <Text style={[styles.rowDescription, { color: theme.colors.textSecondary }]}>
                Configure image upload to R2 storage
              </Text>
            </View>
            <Text style={[styles.chevron, { color: theme.colors.textTertiary }]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          ABOUT
        </Text>
        <View style={[styles.card, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.colors.text }]}>Version</Text>
            <Text style={[styles.rowValue, { color: theme.colors.textSecondary }]}>
              0.0.1
            </Text>
          </View>
        </View>
      </View>

      {/* Logout Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: theme.colors.danger }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: theme.colors.danger }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
  },
  rowDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 24,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionText: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 20,
  },
  logoutButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    height: 32,
  },
});

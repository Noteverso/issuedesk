/**
 * Dashboard screen with issue statistics
 * Implements FR-030, FR-031, FR-032
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../contexts/ThemeContext';
import { useRepository } from '../../contexts/RepositoryContext';
import { githubClient } from '../../api/client';
import type { MainTabParamList } from '../../types';

type DashboardScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

interface DashboardStats {
  total: number;
  open: number;
  closed: number;
  labels: Array<{ name: string; color: string; count: number }>;
}

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { theme } = useTheme();
  const { repository } = useRepository();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!repository) return;

    try {
      const [openIssues, closedIssues, labels] = await Promise.all([
        githubClient.getIssues({ state: 'open', per_page: 100 }),
        githubClient.getIssues({ state: 'closed', per_page: 100 }),
        githubClient.getLabels(),
      ]);

      // Count issues per label
      const allIssues = [...openIssues, ...closedIssues];
      const labelCounts = new Map<string, { color: string; count: number }>();

      allIssues.forEach((issue) => {
        issue.labels.forEach((label) => {
          const existing = labelCounts.get(label.name);
          if (existing) {
            existing.count++;
          } else {
            labelCounts.set(label.name, { color: label.color, count: 1 });
          }
        });
      });

      const labelStats = Array.from(labelCounts.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setStats({
        total: openIssues.length + closedIssues.length,
        open: openIssues.length,
        closed: closedIssues.length,
        labels: labelStats,
      });
      setError(null);
    } catch (err) {
      setError('Failed to load statistics');
    }
  }, [repository]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadStats();
      setIsLoading(false);
    };
    init();
  }, [loadStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
    setIsRefreshing(false);
  };

  const navigateToIssues = (filter?: string) => {
    // Navigate to issues tab (would need to pass filter somehow)
    navigation.navigate('Issues');
  };

  if (!repository) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Select a repository to view statistics
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !stats) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={loadStats}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={() => navigateToIssues()}
          >
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={() => navigateToIssues('open')}
          >
            <Text style={[styles.statValue, { color: theme.colors.openGreen }]}>{stats.open}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Open</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={() => navigateToIssues('closed')}
          >
            <Text style={[styles.statValue, { color: theme.colors.closedPurple }]}>{stats.closed}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Closed</Text>
          </TouchableOpacity>
        </View>

        {/* Label Distribution */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Label Distribution
          </Text>

          {stats.labels.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No labeled issues
            </Text>
          ) : (
            stats.labels.map((label) => (
              <View key={label.name} style={styles.labelRow}>
                <View style={styles.labelInfo}>
                  <View
                    style={[styles.labelDot, { backgroundColor: `#${label.color}` }]}
                  />
                  <Text style={[styles.labelName, { color: theme.colors.text }]}>
                    {label.name}
                  </Text>
                </View>
                <View style={styles.labelBarContainer}>
                  <View
                    style={[
                      styles.labelBar,
                      {
                        backgroundColor: `#${label.color}`,
                        width: `${Math.min((label.count / stats.total) * 100, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.labelCount, { color: theme.colors.textSecondary }]}>
                  {label.count}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  labelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  labelName: {
    fontSize: 14,
    flex: 1,
  },
  labelBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e1e4e8',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  labelBar: {
    height: '100%',
    borderRadius: 4,
  },
  labelCount: {
    fontSize: 14,
    width: 30,
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

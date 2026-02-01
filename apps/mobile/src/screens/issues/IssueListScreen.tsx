/**
 * Issue list screen with filtering and search
 * Implements FR-015, FR-016, FR-017, FR-018
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useRepository } from '../../contexts/RepositoryContext';
import { githubClient } from '../../api/client';
import IssueCard from '../../components/issue/IssueCard';
import type { IssuesStackParamList } from '../../types';

type IssueListScreenNavigationProp = NativeStackNavigationProp<IssuesStackParamList, 'IssueList'>;
type IssueListScreenRouteProp = RouteProp<IssuesStackParamList, 'IssueList'>;

interface Issue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  labels: Array<{ id: number; name: string; color: string; description: string | null }>;
  user: { login: string; avatar_url: string };
  created_at: string;
  comments: number;
}

export default function IssueListScreen() {
  const navigation = useNavigation<IssueListScreenNavigationProp>();
  const route = useRoute<IssueListScreenRouteProp>();
  const { theme } = useTheme();
  const { repository } = useRepository();

  const initialLabelFilter = route.params?.labelFilter;

  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [labelFilter, setLabelFilter] = useState<string | undefined>(initialLabelFilter);
  const [showSearch, setShowSearch] = useState(false);

  const loadIssues = useCallback(async () => {
    if (!repository) return;

    try {
      const data = await githubClient.getIssues({
        state: 'all',
        labels: labelFilter,
        per_page: 100,
      });
      setIssues(data);
      setError(null);
    } catch (err) {
      setError('Failed to load issues');
    }
  }, [repository, labelFilter]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadIssues();
      setIsLoading(false);
    };
    init();
  }, [loadIssues]);

  // Filter issues based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredIssues(issues);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredIssues(
        issues.filter((issue) => issue.title.toLowerCase().includes(query))
      );
    }
  }, [issues, searchQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadIssues();
    setIsRefreshing(false);
  };

  const handleIssuePress = (issueNumber: number) => {
    navigation.navigate('IssueDetail', { issueNumber });
  };

  const handleCreatePress = () => {
    navigation.navigate('CreateIssue');
  };

  const clearFilters = () => {
    setLabelFilter(undefined);
    setSearchQuery('');
  };

  const hasFilters = !!labelFilter || !!searchQuery.trim();

  if (!repository) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Select a repository to view issues
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      {showSearch ? (
        <View style={styles.searchRow}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="Search issues..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <TouchableOpacity
            onPress={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
          >
            <Text style={[styles.cancelText, { color: theme.colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => setShowSearch(true)}>
            <Text style={styles.iconButton}>🔍</Text>
          </TouchableOpacity>

          {hasFilters && (
            <TouchableOpacity
              style={[styles.clearButton, { borderColor: theme.colors.border }]}
              onPress={clearFilters}
            >
              <Text style={[styles.clearButtonText, { color: theme.colors.textSecondary }]}>
                Clear Filters
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={loadIssues}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}

      <FlatList
        data={filteredIssues}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <IssueCard issue={item} onPress={() => handleIssuePress(item.number)} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {hasFilters ? 'No issues match your filters' : 'No issues yet'}
            </Text>
          </View>
        }
      />

      {/* FAB for creating new issue */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreatePress}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
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
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    fontSize: 24,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 14,
  },
  list: {
    padding: 16,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 32,
    lineHeight: 32,
  },
});

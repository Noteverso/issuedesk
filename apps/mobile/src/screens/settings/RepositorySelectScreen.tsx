/**
 * Repository selection screen
 * Implements FR-010, FR-011, FR-012
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useRepository } from '../../contexts/RepositoryContext';
import { githubClient } from '../../api/client';
import type { AuthStackParamList, SelectedRepository } from '../../types';

type RepositorySelectScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RepositorySelect'>;
type RepositorySelectScreenRouteProp = RouteProp<AuthStackParamList, 'RepositorySelect'>;

interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  description: string | null;
  private: boolean;
}

export default function RepositorySelectScreen() {
  const navigation = useNavigation<RepositorySelectScreenNavigationProp>();
  const route = useRoute<RepositorySelectScreenRouteProp>();
  const { theme } = useTheme();
  const { selectRepository } = useRepository();

  const isInitial = route.params?.isInitial ?? false;
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const repos = await githubClient.getRepositories();
      setRepositories(repos);
    } catch (err) {
      setError('Failed to load repositories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (repo: Repository) => {
    const selectedRepo: SelectedRepository = {
      id: repo.id,
      owner: repo.owner.login,
      name: repo.name,
      fullName: repo.full_name,
    };

    await selectRepository(selectedRepo);

    if (isInitial) {
      // Navigation will automatically switch to Main due to AppNavigator logic
    } else {
      navigation.goBack();
    }
  };

  const renderRepository = ({ item }: { item: Repository }) => (
    <TouchableOpacity
      style={[styles.repoItem, { borderColor: theme.colors.border }]}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.repoInfo}>
        <View style={styles.repoNameRow}>
          <Text style={[styles.repoName, { color: theme.colors.text }]}>
            {item.full_name}
          </Text>
          {item.private && (
            <View style={[styles.privateBadge, { backgroundColor: theme.colors.warning + '20' }]}>
              <Text style={[styles.privateBadgeText, { color: theme.colors.warning }]}>
                Private
              </Text>
            </View>
          )}
        </View>
        {item.description && (
          <Text style={[styles.repoDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
      <Text style={[styles.chevron, { color: theme.colors.textTertiary }]}>›</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading repositories...
          </Text>
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
            onPress={loadRepositories}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isInitial && (
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Choose a Repository
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Select a repository to manage its issues
          </Text>
        </View>
      )}
      <FlatList
        data={repositories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRepository}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No repositories found
            </Text>
          </View>
        }
      />
    </SafeAreaView>
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
    gap: 16,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  list: {
    padding: 16,
  },
  repoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  repoInfo: {
    flex: 1,
  },
  repoNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  repoName: {
    fontSize: 16,
    fontWeight: '600',
  },
  privateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  privateBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  repoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  chevron: {
    fontSize: 24,
    marginLeft: 8,
  },
  separator: {
    height: 8,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
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
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

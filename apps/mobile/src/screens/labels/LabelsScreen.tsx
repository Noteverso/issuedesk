/**
 * Labels screen
 * Implements FR-028, FR-029
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../contexts/ThemeContext';
import { useRepository } from '../../contexts/RepositoryContext';
import { githubClient } from '../../api/client';
import type { MainTabParamList } from '../../types';

type LabelsScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Labels'>;

interface Label {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export default function LabelsScreen() {
  const navigation = useNavigation<LabelsScreenNavigationProp>();
  const { theme } = useTheme();
  const { repository } = useRepository();

  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLabels = useCallback(async () => {
    if (!repository) return;

    try {
      const data = await githubClient.getLabels();
      setLabels(data);
      setError(null);
    } catch (err) {
      setError('Failed to load labels');
    }
  }, [repository]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadLabels();
      setIsLoading(false);
    };
    init();
  }, [loadLabels]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLabels();
    setIsRefreshing(false);
  };

  const handleLabelPress = (labelName: string) => {
    // Navigate to issues tab with label filter
    // Note: This would ideally pass the filter through params
    navigation.navigate('Issues');
  };

  const getContrastColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#24292f' : '#ffffff';
  };

  const renderLabel = ({ item }: { item: Label }) => {
    const backgroundColor = `#${item.color}`;
    const textColor = getContrastColor(backgroundColor);

    return (
      <TouchableOpacity
        style={[styles.labelItem, { borderColor: theme.colors.border }]}
        onPress={() => handleLabelPress(item.name)}
      >
        <View style={[styles.labelBadge, { backgroundColor }]}>
          <Text style={[styles.labelName, { color: textColor }]}>{item.name}</Text>
        </View>
        {item.description && (
          <Text style={[styles.labelDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (!repository) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          Select a repository to view labels
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={loadLabels}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={labels}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderLabel}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No labels in this repository
            </Text>
          </View>
        }
      />
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
  list: {
    padding: 16,
  },
  labelItem: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  labelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  labelName: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelDescription: {
    fontSize: 14,
    lineHeight: 20,
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
});

/**
 * Reusable label list component
 * Implements T064
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import LabelBadge from './LabelBadge';

interface Label {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

interface LabelListProps {
  labels: Label[];
  isLoading?: boolean;
  onLabelPress?: (labelName: string) => void;
  emptyMessage?: string;
}

export default function LabelList({
  labels,
  isLoading = false,
  onLabelPress,
  emptyMessage = 'No labels found',
}: LabelListProps) {
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (labels.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  const renderLabel = ({ item }: { item: Label }) => (
    <TouchableOpacity
      style={[styles.labelItem, { backgroundColor: theme.colors.backgroundSecondary }]}
      onPress={() => onLabelPress?.(item.name)}
      disabled={!onLabelPress}
    >
      <View style={styles.labelHeader}>
        <LabelBadge name={item.name} color={item.color} />
        <View style={styles.labelInfo}>
          <Text style={[styles.labelName, { color: theme.colors.text }]}>{item.name}</Text>
          {item.description && (
            <Text
              style={[styles.labelDescription, { color: theme.colors.textSecondary }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={labels}
      renderItem={renderLabel}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => (
        <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  labelItem: {
    padding: 16,
    borderRadius: 8,
  },
  labelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  labelInfo: {
    flex: 1,
  },
  labelName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  labelDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    marginVertical: 8,
  },
});

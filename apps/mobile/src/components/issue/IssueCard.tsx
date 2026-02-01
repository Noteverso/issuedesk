/**
 * Issue card component
 * Shows title, labels (colored badges), state indicator
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import LabelBadge from '../label/LabelBadge';

interface Label {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

interface Issue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  labels: Label[];
  user: { login: string; avatar_url: string };
  created_at: string;
  comments: number;
}

interface IssueCardProps {
  issue: Issue;
  onPress: () => void;
}

export default function IssueCard({ issue, onPress }: IssueCardProps) {
  const { theme } = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const isOpen = issue.state === 'open';
  const stateColor = isOpen ? theme.colors.openGreen : theme.colors.closedPurple;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.stateIndicator, { backgroundColor: stateColor }]}>
          <Text style={styles.stateIcon}>{isOpen ? '●' : '✓'}</Text>
        </View>
        <Text style={[styles.number, { color: theme.colors.textSecondary }]}>
          #{issue.number}
        </Text>
      </View>

      <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
        {issue.title}
      </Text>

      {issue.labels.length > 0 && (
        <View style={styles.labels}>
          {issue.labels.slice(0, 4).map((label) => (
            <LabelBadge key={label.id} name={label.name} color={label.color} />
          ))}
          {issue.labels.length > 4 && (
            <Text style={[styles.moreLabels, { color: theme.colors.textTertiary }]}>
              +{issue.labels.length - 4}
            </Text>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={[styles.meta, { color: theme.colors.textTertiary }]}>
          opened {formatDate(issue.created_at)} by {issue.user.login}
        </Text>
        {issue.comments > 0 && (
          <Text style={[styles.comments, { color: theme.colors.textSecondary }]}>
            💬 {issue.comments}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stateIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stateIcon: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  number: {
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 8,
  },
  labels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  moreLabels: {
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
    flex: 1,
  },
  comments: {
    fontSize: 12,
    marginLeft: 8,
  },
});

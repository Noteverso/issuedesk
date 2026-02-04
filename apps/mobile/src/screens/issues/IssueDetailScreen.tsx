/**
 * Issue detail screen
 * Implements FR-019, FR-022, FR-025
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getMarkdownStyles } from '../../styles/markdown';
import { githubClient } from '../../api/client';
import LabelBadge from '../../components/label/LabelBadge';
import CommentCard from '../../components/comment/CommentCard';
import { CommentForm } from '../../components/comment/CommentForm';
import type { IssuesStackParamList } from '../../types';

type IssueDetailScreenNavigationProp = NativeStackNavigationProp<IssuesStackParamList, 'IssueDetail'>;
type IssueDetailScreenRouteProp = RouteProp<IssuesStackParamList, 'IssueDetail'>;

interface Issue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: Array<{ id: number; name: string; color: string; description: string | null }>;
  user: { login: string; avatar_url: string };
  created_at: string;
  updated_at: string;
  comments: number;
  html_url: string;
}

interface Comment {
  id: number;
  body: string;
  user: { login: string; avatar_url: string };
  created_at: string;
  updated_at: string;
}

export default function IssueDetailScreen() {
  const navigation = useNavigation<IssueDetailScreenNavigationProp>();
  const route = useRoute<IssueDetailScreenRouteProp>();
  const { theme } = useTheme();
  const { user } = useAuth();

  const { issueNumber } = route.params;

  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);

  const loadIssue = useCallback(async () => {
    try {
      const [issueData, commentsData] = await Promise.all([
        githubClient.getIssue(issueNumber),
        githubClient.getComments(issueNumber),
      ]);
      setIssue(issueData);
      setComments(commentsData);
      setError(null);
    } catch (err) {
      setError('Failed to load issue');
    }
  }, [issueNumber]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadIssue();
      setIsLoading(false);
    };
    init();
  }, [loadIssue]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadIssue();
    setIsRefreshing(false);
  };

  const handleEdit = () => {
    navigation.navigate('EditIssue', { issueNumber });
  };

  const handleOpenExternal = async () => {
    if (issue?.html_url) {
      await Linking.openURL(issue.html_url);
    }
  };

  const handleToggleState = async () => {
    if (!issue) return;

    try {
      const newState = issue.state === 'open' ? 'closed' : 'open';
      await githubClient.updateIssue(issueNumber, { state: newState });
      setIssue({ ...issue, state: newState });
    } catch (err) {
      // Handle error
    }
  };

  const handleAddComment = async (body: string) => {
    const newComment = await githubClient.createComment(issueNumber, body);
    setComments([...comments, newComment]);
    setShowCommentForm(false);
  };

  const handleUpdateComment = async (commentId: number, body: string) => {
    const updatedComment = await githubClient.updateComment(commentId, body);
    setComments(comments.map((c) => (c.id === commentId ? updatedComment : c)));
  };

  const handleDeleteComment = async (commentId: number) => {
    await githubClient.deleteComment(commentId);
    setComments(comments.filter((c) => c.id !== commentId));
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleOpenExternal}>
            <Text style={styles.headerIcon}>🔗</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEdit}>
            <Text style={styles.headerIcon}>✏️</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, issue]);

  const markdownStyles = getMarkdownStyles(theme.mode === 'dark');

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !issue) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={loadIssue}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOpen = issue.state === 'open';
  const stateColor = isOpen ? theme.colors.openGreen : theme.colors.closedPurple;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{issue.title}</Text>
            <Text style={[styles.number, { color: theme.colors.textSecondary }]}>#{issue.number}</Text>
          </View>

          <View style={styles.stateRow}>
            <TouchableOpacity
              style={[styles.stateBadge, { backgroundColor: stateColor }]}
              onPress={handleToggleState}
            >
              <Text style={styles.stateText}>
                {isOpen ? '● Open' : '✓ Closed'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
              {issue.user.login} opened this issue
            </Text>
          </View>
        </View>

        {/* Labels */}
        {issue.labels.length > 0 && (
          <View style={styles.labels}>
            {issue.labels.map((label) => (
              <LabelBadge key={label.id} name={label.name} color={label.color} />
            ))}
          </View>
        )}

        {/* Body */}
        <View style={[styles.body, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
          {issue.body ? (
            <Markdown style={markdownStyles}>{issue.body}</Markdown>
          ) : (
            <Text style={[styles.emptyBody, { color: theme.colors.textTertiary }]}>
              No description provided.
            </Text>
          )}
        </View>

        {/* Comments */}
        <View style={styles.commentsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Comments ({comments.length})
          </Text>

          {comments.length === 0 ? (
            <Text style={[styles.noComments, { color: theme.colors.textSecondary }]}>
              No comments yet
            </Text>
          ) : (
            comments.map((comment) => (
              <CommentCard 
                key={comment.id} 
                comment={comment} 
                currentUserLogin={user?.username || ''}
                onEdit={handleUpdateComment}
                onDelete={handleDeleteComment}
              />
            ))
          )}

          {showCommentForm ? (
            <View style={styles.commentFormContainer}>
              <CommentForm
                onSubmit={handleAddComment}
                placeholder="Write a comment..."
              />
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={() => setShowCommentForm(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addCommentButton, { borderColor: theme.colors.border }]}
              onPress={() => setShowCommentForm(true)}
            >
              <Text style={[styles.addCommentText, { color: theme.colors.primary }]}>
                + Add Comment
              </Text>
            </TouchableOpacity>
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
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIcon: {
    fontSize: 20,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    lineHeight: 28,
  },
  number: {
    fontSize: 16,
    marginTop: 4,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stateText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  meta: {
    fontSize: 14,
    flex: 1,
  },
  labels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  body: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  emptyBody: {
    fontStyle: 'italic',
  },
  commentsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  noComments: {
    fontSize: 14,
    marginBottom: 16,
  },
  addCommentButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 8,
  },
  addCommentText: {
    fontSize: 16,
    fontWeight: '500',
  },
  commentFormContainer: {
    marginTop: 8,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
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

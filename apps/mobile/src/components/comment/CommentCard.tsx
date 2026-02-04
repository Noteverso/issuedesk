/**
 * Comment card component
 * Shows author, timestamp, rendered markdown
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../contexts/ThemeContext';
import { getMarkdownStyles } from '../../styles/markdown';
import { CommentEditorModal } from './CommentEditorModal';

interface Comment {
  id: number;
  body: string;
  user: { login: string; avatar_url: string };
  created_at: string;
  updated_at: string;
}

interface CommentCardProps {
  comment: Comment;
  currentUserLogin?: string;
  onEdit?: (commentId: number, body: string) => Promise<void>;
  onDelete?: (commentId: number) => Promise<void>;
}

export default function CommentCard({ comment, currentUserLogin, onEdit, onDelete }: CommentCardProps) {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState(comment.body);
  const [isExpanded, setIsExpanded] = useState(false);

  const isOwnComment = currentUserLogin && comment.user.login === currentUserLogin;
  
  // Check if content is long (more than 300 characters)
  const isLongContent = comment.body.length > 300;
  const displayBody = isExpanded || !isLongContent 
    ? comment.body 
    : comment.body.substring(0, 300) + '...';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSave = async (body: string) => {
    if (!onEdit) return;

    try {
      await onEdit(comment.id, body);
      setEditedBody(body);
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update comment');
      throw error;
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(comment.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const markdownStyles = getMarkdownStyles(theme.mode === 'dark');

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.author, { color: theme.colors.text }]}>
              {comment.user.login}
            </Text>
            <Text style={[styles.date, { color: theme.colors.textTertiary }]}>
              {formatDate(comment.created_at)}
            </Text>
          </View>
          {isOwnComment && (
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionButton}>
                <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                <Text style={[styles.actionText, { color: theme.colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.body}>
          <Markdown style={markdownStyles}>{displayBody}</Markdown>
          {isLongContent && (
            <TouchableOpacity 
              onPress={() => setIsExpanded(!isExpanded)}
              style={styles.expandButton}
            >
              <Text style={[styles.expandText, { color: theme.colors.primary }]}>
                {isExpanded ? '收起' : '查看更多'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Edit Modal */}
      <CommentEditorModal
        visible={isEditing}
        initialValue={editedBody}
        onSave={handleSave}
        onCancel={() => {
          setIsEditing(false);
          setEditedBody(comment.body);
        }}
        title="Edit Comment"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  author: {
    fontWeight: '600',
    fontSize: 14,
  },
  date: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  body: {
    padding: 12,
  },
  expandButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  expandText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
  },
});

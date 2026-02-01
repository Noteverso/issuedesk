/**
 * Comment card component
 * Shows author, timestamp, rendered markdown
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../contexts/ThemeContext';

interface Comment {
  id: number;
  body: string;
  user: { login: string; avatar_url: string };
  created_at: string;
  updated_at: string;
}

interface CommentCardProps {
  comment: Comment;
}

export default function CommentCard({ comment }: CommentCardProps) {
  const { theme } = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const markdownStyles = {
    body: { color: theme.colors.text, fontSize: 14, lineHeight: 20 },
    code_inline: { 
      backgroundColor: theme.colors.backgroundTertiary, 
      color: theme.colors.text,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
      fontFamily: 'monospace',
      fontSize: 13,
    },
    fence: { 
      backgroundColor: theme.colors.backgroundSecondary, 
      padding: 8, 
      borderRadius: 6,
      fontFamily: 'monospace',
      fontSize: 13,
    },
    link: { color: theme.colors.primary },
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.author, { color: theme.colors.text }]}>
          {comment.user.login}
        </Text>
        <Text style={[styles.date, { color: theme.colors.textTertiary }]}>
          {formatDate(comment.created_at)}
        </Text>
      </View>
      <View style={styles.body}>
        <Markdown style={markdownStyles}>{comment.body}</Markdown>
      </View>
    </View>
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
    borderBottomColor: '#e1e4e8',
  },
  author: {
    fontWeight: '600',
    fontSize: 14,
  },
  date: {
    fontSize: 12,
  },
  body: {
    padding: 12,
  },
});

/**
 * CommentForm Component
 * Input form for creating new comments on issues
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { CommentEditorModal } from './CommentEditorModal';

interface CommentFormProps {
  onSubmit: (body: string) => Promise<void>;
  placeholder?: string;
  submitLabel?: string;
  disabled?: boolean;
  initialValue?: string;
}

export function CommentForm({
  onSubmit,
  placeholder = 'Add a comment...',
  submitLabel = 'Comment',
  disabled = false,
  initialValue = '',
}: CommentFormProps) {
  const { theme } = useTheme();
  const [body, setBody] = useState(initialValue);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (commentBody: string) => {
    if (!commentBody.trim() || disabled) return;

    setError(null);

    try {
      await onSubmit(commentBody.trim());
      setBody('');
      setIsModalVisible(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit comment');
      throw err;
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      padding: theme.spacing.md,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    input: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
      minHeight: 40,
    },
    writeButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      minHeight: 40,
      justifyContent: 'center',
    },
    writeButtonText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.md,
      fontWeight: '600',
    },
    errorText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    },
  });

  return (
    <>
      <View style={styles.container}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textTertiary}
            value={body}
            onChangeText={setBody}
            editable={!disabled}
            onFocus={() => setIsModalVisible(true)}
            multiline
          />
          <TouchableOpacity
            style={styles.writeButton}
            onPress={() => setIsModalVisible(true)}
            disabled={disabled}
          >
            <Text style={styles.writeButtonText}>Write</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Full-screen Editor Modal */}
      <CommentEditorModal
        visible={isModalVisible}
        initialValue={body}
        onSave={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        title="New Comment"
      />
    </>
  );
}
/**
 * CommentForm Component
 * Input form for creating new comments on issues
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface CommentFormProps {
  onSubmit: (body: string) => Promise<void>;
  placeholder?: string;
  submitLabel?: string;
  disabled?: boolean;
}

export function CommentForm({
  onSubmit,
  placeholder = 'Add a comment...',
  submitLabel = 'Comment',
  disabled = false,
}: CommentFormProps) {
  const { theme } = useTheme();
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!body.trim() || isSubmitting || disabled) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(body.trim());
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = body.trim().length > 0 && !isSubmitting && !disabled;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      padding: theme.spacing.md,
    },
    inputContainer: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.background,
      marginBottom: theme.spacing.sm,
    },
    input: {
      padding: theme.spacing.md,
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
      minHeight: 80,
      maxHeight: 200,
      textAlignVertical: 'top',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    hint: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    submitButton: {
      backgroundColor: canSubmit ? theme.colors.primary : theme.colors.border,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    submitButtonText: {
      color: canSubmit ? '#FFFFFF' : theme.colors.textSecondary,
      fontSize: theme.fontSize.md,
      fontWeight: '600',
    },
    errorText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.error,
      marginBottom: theme.spacing.sm,
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            value={body}
            onChangeText={setBody}
            multiline
            editable={!disabled && !isSubmitting}
            autoCapitalize="sentences"
            autoCorrect
          />
        </View>
        <View style={styles.footer}>
          <Text style={styles.hint}>Markdown supported</Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting && <ActivityIndicator size="small" color="#FFFFFF" />}
            <Text style={styles.submitButtonText}>{submitLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

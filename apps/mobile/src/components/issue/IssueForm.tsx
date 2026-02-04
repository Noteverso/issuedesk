/**
 * Reusable issue form component for create and edit screens
 * Implements T047, T057
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface IssueFormProps {
  title: string;
  body: string;
  onTitleChange: (text: string) => void;
  onBodyChange: (text: string) => void;
  error?: string | null;
  autoFocusTitle?: boolean;
}

export default function IssueForm({
  title,
  body,
  onTitleChange,
  onBodyChange,
  error,
  autoFocusTitle = false,
}: IssueFormProps) {
  const { theme } = useTheme();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {error && (
          <View style={[styles.errorBox, { backgroundColor: theme.colors.danger + '20' }]}>
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Title</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Issue title"
              placeholderTextColor={theme.colors.textTertiary}
              value={title}
              onChangeText={onTitleChange}
              autoFocus={autoFocusTitle}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Description (optional)
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Describe the issue (supports Markdown)"
              placeholderTextColor={theme.colors.textTertiary}
              value={body}
              onChangeText={onBodyChange}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  errorBox: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 200,
  },
});

/**
 * Create issue screen
 * Implements FR-020
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { githubClient } from '../../api/client';
import type { IssuesStackParamList } from '../../types';

type CreateIssueScreenNavigationProp = NativeStackNavigationProp<IssuesStackParamList, 'CreateIssue'>;

export default function CreateIssueScreen() {
  const navigation = useNavigation<CreateIssueScreenNavigationProp>();
  const { theme } = useTheme();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = title.trim() || body.trim();

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await githubClient.createIssue({
        title: title.trim(),
        body: body.trim() || undefined,
      });

      // Navigate to the new issue
      navigation.replace('IssueDetail', { issueNumber: result.number });
    } catch (err) {
      setError('Failed to create issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={handleCancel}>
          <Text style={[styles.cancelButton, { color: theme.colors.primary }]}>Cancel</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting || !title.trim()}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text
              style={[
                styles.submitButton,
                { color: theme.colors.primary },
                !title.trim() && styles.submitButtonDisabled,
              ]}
            >
              Create
            </Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, title, isSubmitting, isDirty, theme.colors.primary]);

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
              onChangeText={setTitle}
              autoFocus
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Description (optional)</Text>
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
              onChangeText={setBody}
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
  cancelButton: {
    fontSize: 16,
  },
  submitButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  errorBox: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    minHeight: 200,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});

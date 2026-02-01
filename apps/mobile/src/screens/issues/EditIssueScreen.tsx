/**
 * Edit issue screen
 * Implements FR-021
 */

import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { githubClient } from '../../api/client';
import type { IssuesStackParamList } from '../../types';

type EditIssueScreenNavigationProp = NativeStackNavigationProp<IssuesStackParamList, 'EditIssue'>;
type EditIssueScreenRouteProp = RouteProp<IssuesStackParamList, 'EditIssue'>;

export default function EditIssueScreen() {
  const navigation = useNavigation<EditIssueScreenNavigationProp>();
  const route = useRoute<EditIssueScreenRouteProp>();
  const { theme } = useTheme();

  const { issueNumber } = route.params;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalBody, setOriginalBody] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadIssue = async () => {
      try {
        const issue = await githubClient.getIssue(issueNumber);
        setTitle(issue.title);
        setBody(issue.body || '');
        setOriginalTitle(issue.title);
        setOriginalBody(issue.body || '');
      } catch (err) {
        setError('Failed to load issue');
      } finally {
        setIsLoading(false);
      }
    };
    loadIssue();
  }, [issueNumber]);

  const isDirty = title !== originalTitle || body !== originalBody;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await githubClient.updateIssue(issueNumber, {
        title: title.trim(),
        body: body.trim() || undefined,
      });

      navigation.goBack();
    } catch (err) {
      setError('Failed to update issue. Please try again.');
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
          disabled={isSubmitting || !title.trim() || !isDirty}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text
              style={[
                styles.submitButton,
                { color: theme.colors.primary },
                (!title.trim() || !isDirty) && styles.submitButtonDisabled,
              ]}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, title, isSubmitting, isDirty, theme.colors.primary]);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

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
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

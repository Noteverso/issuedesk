/**
 * Full-screen modal editor for comments
 * Similar to GitHub mobile app implementation
 */

import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { RichTextEditor } from '../editor/RichTextEditor';

interface CommentEditorModalProps {
  visible: boolean;
  initialValue: string;
  onSave: (body: string) => Promise<void>;
  onCancel: () => void;
  title?: string;
}

export function CommentEditorModal({
  visible,
  initialValue,
  onSave,
  onCancel,
  title = 'Edit Comment',
}: CommentEditorModalProps) {
  const { theme } = useTheme();
  const [body, setBody] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!body.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onSave(body.trim());
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = body.trim().length > 0 && !isSaving;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity
              onPress={onCancel}
              disabled={isSaving}
              style={styles.headerButton}
            >
              <Text style={[styles.headerButtonText, { color: theme.colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {title}
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave}
              style={styles.headerButton}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text
                  style={[
                    styles.headerButtonText,
                    {
                      color: canSave ? theme.colors.primary : theme.colors.textTertiary,
                      fontWeight: '600',
                    },
                  ]}
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Editor */}
          <View style={styles.editorContainer}>
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder="Write your comment..."
              minHeight={200}
              maxHeight={600}
            />
          </View>

          {/* Footer hint */}
          <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Markdown supported • Images upload to R2
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 60,
    paddingVertical: 4,
  },
  headerButtonText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  editorContainer: {
    flex: 1,
    padding: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
  },
});

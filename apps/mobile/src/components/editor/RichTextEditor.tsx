import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToR2 } from '../../services/r2Upload';

interface RichTextEditorProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your content here...',
  minHeight = 120,
  maxHeight = 400,
}: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);
  
  // History for undo/redo
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Update history when value changes (debounced)
  const updateHistory = (newValue: string) => {
    if (newValue !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newValue);
      // Keep only last 50 items
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  // Insert text at cursor position
  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    const beforeCursor = value.substring(0, selectionStart);
    const afterCursor = value.substring(selectionEnd);
    const selectedText = value.substring(selectionStart, selectionEnd);
    
    const textToInsert = selectedText || placeholder;
    const newText = beforeCursor + before + textToInsert + after + afterCursor;
    const newCursorPos = beforeCursor.length + before.length + textToInsert.length;
    
    onChange(newText);
    updateHistory(newText);
    
    // Set cursor position and clear it after applying
    setTimeout(() => {
      setSelection({ start: newCursorPos, end: newCursorPos });
      // Clear selection state after applying to allow normal scrolling
      setTimeout(() => setSelection(undefined), 100);
    }, 0);
  };
  
  // Undo handler
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };
  
  // Redo handler
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  // Format buttons handlers
  const handleBold = () => insertText('**', '**', 'bold text');
  const handleItalic = () => insertText('*', '*', 'italic text');
  const handleStrikethrough = () => insertText('~~', '~~', 'strikethrough');
  const handleCode = () => insertText('`', '`', 'code');
  const handleCodeBlock = () => insertText('\n```\n', '\n```\n', 'code block');
  const handleHeading1 = () => insertText('# ', '', 'Heading 1');
  const handleHeading2 = () => insertText('## ', '', 'Heading 2');
  const handleHeading3 = () => insertText('### ', '', 'Heading 3');
  const handleQuote = () => insertText('> ', '', 'quote');
  const handleUnorderedList = () => insertText('- ', '', 'list item');
  const handleOrderedList = () => insertText('1. ', '', 'list item');
  const handleTaskList = () => insertText('- [ ] ', '', 'task item');
  const handleLink = () => insertText('[', '](url)', 'link text');
  const handleHorizontalRule = () => insertText('\n---\n', '', '');

  // Image upload handler
  const handleImageUpload = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access photos.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      setIsUploading(true);

      try {
        // Upload to R2
        const imageUrl = await uploadImageToR2(asset.uri, asset.fileName || 'image.jpg');
        
        // Insert markdown image syntax
        const beforeCursor = value.substring(0, selectionStart);
        const afterCursor = value.substring(selectionEnd);
        const imageMarkdown = `![${asset.fileName || 'image'}](${imageUrl})`;
        const newText = beforeCursor + imageMarkdown + afterCursor;
        
        onChange(newText);
        
        Alert.alert('Success', 'Image uploaded successfully!');
      } catch (error) {
        console.error('Image upload failed:', error);
        Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Formatting Toolbar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolbar}>
        <TouchableOpacity 
          style={[styles.toolbarButton, historyIndex === 0 && styles.toolbarButtonDisabled]} 
          onPress={handleUndo}
          disabled={historyIndex === 0}
        >
          <Text style={styles.toolbarIcon}>↶</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toolbarButton, historyIndex >= history.length - 1 && styles.toolbarButtonDisabled]} 
          onPress={handleRedo}
          disabled={historyIndex >= history.length - 1}
        >
          <Text style={styles.toolbarIcon}>↷</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.toolbarButton} onPress={handleBold}>
          <Text style={styles.toolbarIcon}>B</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleItalic}>
          <Text style={[styles.toolbarIcon, styles.italic]}>I</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleStrikethrough}>
          <Text style={[styles.toolbarIcon, styles.strikethrough]}>S</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleCode}>
          <Text style={styles.toolbarIcon}>{`</>`}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleCodeBlock}>
          <Text style={styles.toolbarIcon}>{'{ }'}</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.toolbarButton} onPress={handleHeading1}>
          <Text style={styles.toolbarIcon}>H1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleHeading2}>
          <Text style={styles.toolbarIcon}>H2</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleHeading3}>
          <Text style={styles.toolbarIcon}>H3</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.toolbarButton} onPress={handleQuote}>
          <Text style={styles.toolbarIcon}>"</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleUnorderedList}>
          <Text style={styles.toolbarIcon}>•</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleOrderedList}>
          <Text style={styles.toolbarIcon}>1.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleTaskList}>
          <Text style={styles.toolbarIcon}>☐</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.toolbarButton} onPress={handleLink}>
          <Text style={styles.toolbarIcon}>🔗</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toolbarButton, isUploading && styles.toolbarButtonDisabled]} 
          onPress={handleImageUpload}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#666" />
          ) : (
            <Text style={styles.toolbarIcon}>🖼️</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleHorizontalRule}>
          <Text style={styles.toolbarIcon}>─</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Text Input */}
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={(text) => {
          onChange(text);
          updateHistory(text);
        }}
        onSelectionChange={(event) => {
          const { start, end } = event.nativeEvent.selection;
          setSelectionStart(start);
          setSelectionEnd(end);
        }}
        {...(selection !== undefined && { selection })}
        placeholder={placeholder}
        placeholderTextColor="#999"
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#d1d5da',
    borderRadius: 6,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#f6f8fa',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5da',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  toolbarButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 4,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5da',
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarButtonDisabled: {
    opacity: 0.5,
  },
  toolbarIcon: {
    fontSize: 14,
    fontWeight: '600',
    color: '#24292e',
  },
  italic: {
    fontStyle: 'italic',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  separator: {
    width: 1,
    backgroundColor: '#d1d5da',
    marginHorizontal: 8,
  },
  input: {

    padding: 12,
    fontSize: 15,
    lineHeight: 21,
    color: '#24292e',
    fontFamily: 'System',
  },
});

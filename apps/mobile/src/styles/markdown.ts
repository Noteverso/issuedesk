/**
 * GitHub-style markdown styles for react-native-markdown-display
 */

import { StyleSheet } from 'react-native';
import { colors } from './theme';

export const getMarkdownStyles = (isDark: boolean) => {
  const themeColors = isDark ? colors.dark : colors.light;

  return StyleSheet.create({
    body: {
      color: themeColors.text,
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      fontSize: 32,
      fontWeight: '600',
      color: themeColors.text,
      marginTop: 24,
      marginBottom: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    heading2: {
      fontSize: 24,
      fontWeight: '600',
      color: themeColors.text,
      marginTop: 24,
      marginBottom: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    heading3: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    heading4: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    heading5: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    heading6: {
      fontSize: 13,
      fontWeight: '600',
      color: themeColors.textSecondary,
      marginTop: 16,
      marginBottom: 8,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 16,
      color: themeColors.text,
      fontSize: 16,
      lineHeight: 24,
    },
    blockquote: {
      backgroundColor: themeColors.backgroundSecondary,
      borderLeftWidth: 4,
      borderLeftColor: themeColors.border,
      paddingLeft: 16,
      paddingVertical: 8,
      marginVertical: 16,
    },
    code_inline: {
      backgroundColor: isDark ? 'rgba(110, 118, 129, 0.4)' : 'rgba(175, 184, 193, 0.2)',
      color: themeColors.text,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      fontSize: 14,
      fontFamily: 'Courier New',
    },
    code_block: {
      backgroundColor: isDark ? '#161b22' : '#f6f8fa',
      color: themeColors.text,
      padding: 16,
      borderRadius: 6,
      fontSize: 14,
      fontFamily: 'Courier New',
      marginVertical: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    fence: {
      backgroundColor: isDark ? '#161b22' : '#f6f8fa',
      color: themeColors.text,
      padding: 16,
      borderRadius: 6,
      fontSize: 14,
      fontFamily: 'Courier New',
      marginVertical: 16,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    link: {
      color: colors.primary,
      textDecorationLine: 'none',
    },
    list_item: {
      marginVertical: 4,
      flexDirection: 'row',
    },
    bullet_list: {
      marginVertical: 8,
    },
    ordered_list: {
      marginVertical: 8,
    },
    bullet_list_icon: {
      marginLeft: 10,
      marginRight: 10,
      color: themeColors.textSecondary,
    },
    ordered_list_icon: {
      marginLeft: 10,
      marginRight: 10,
      color: themeColors.textSecondary,
    },
    hr: {
      backgroundColor: themeColors.border,
      height: 1,
      marginVertical: 24,
    },
    table: {
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 6,
      marginVertical: 16,
    },
    thead: {
      backgroundColor: themeColors.backgroundSecondary,
    },
    tbody: {},
    th: {
      padding: 8,
      fontWeight: '600',
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    tr: {
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    td: {
      padding: 8,
    },
    strong: {
      fontWeight: '600',
    },
    em: {
      fontStyle: 'italic',
    },
    s: {
      textDecorationLine: 'line-through',
    },
    image: {
      maxWidth: '100%',
      height: undefined,
      aspectRatio: 16 / 9,
      marginVertical: 8,
      borderRadius: 6,
    },
  });
};

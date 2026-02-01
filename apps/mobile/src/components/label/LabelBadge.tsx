/**
 * Label badge component
 * Renders colored label badge
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LabelBadgeProps {
  name: string;
  color: string;
  showDescription?: boolean;
  description?: string | null;
}

/**
 * Calculate contrasting text color for a given background color
 */
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#24292f' : '#ffffff';
}

export default function LabelBadge({ name, color, showDescription, description }: LabelBadgeProps) {
  const backgroundColor = color.startsWith('#') ? color : `#${color}`;
  const textColor = getContrastColor(backgroundColor);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});

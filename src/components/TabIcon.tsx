import React from 'react';
import { View, StyleSheet, Text, ColorValue } from 'react-native';

interface TabIconProps {
  name: 'today' | 'search' | 'recipe' | 'targets';
  focused: boolean;
  color?: ColorValue | string;
}

export const TabIcon: React.FC<TabIconProps> = ({ name, focused, color }) => {
  const getIconGlyph = () => {
    switch (name) {
      case 'today':
        return '◎';
      case 'search':
        return '⌕';
      case 'recipe':
        return '∆';
      case 'targets':
        return '⊕';
    }
  };

  return (
    <View style={[styles.container, focused && styles.focusedContainer]}>
      <Text style={[styles.iconText, { color: (color as string) || '#F2F2F2', opacity: focused ? 1 : 0.6 }]}>
        {getIconGlyph()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  focusedContainer: {
    backgroundColor: 'rgba(255, 138, 31, 0.14)',
  },
  iconText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

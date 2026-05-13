import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { CardProps } from '@types';

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
  onPress,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const getCardStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
    };

    const variantStyles: Record<string, ViewStyle> = {
      elevated: {
        backgroundColor: theme.colors.card,
        ...theme.shadows.sm,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
      },
      filled: {
        backgroundColor:
          theme.mode === 'dark'
            ? theme.colors.surface
            : theme.colors.primary + '07',
      },
    };

    const paddingStyles: Record<string, ViewStyle> = {
      sm: { padding: theme.spacing.sm + 4 },
      md: { padding: theme.spacing.md + 4 },
      lg: { padding: theme.spacing.lg },
    };

    const cardStyles: ViewStyle[] = [baseStyle, variantStyles[variant], paddingStyles[padding]];
    if (style) {
      cardStyles.push(StyleSheet.flatten(style));
    }
    return cardStyles;
  };

  const content = <View>{children}</View>;

  if (onPress) {
    return (
      <TouchableOpacity
        style={getCardStyle()}
        onPress={onPress}
        activeOpacity={0.72}
        accessibilityRole="button"
        {...props}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={getCardStyle()} {...props}>
      {content}
    </View>
  );
};

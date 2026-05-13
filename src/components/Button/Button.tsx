import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { ButtonProps } from '@types';

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
  ...props
}) => {
  const { theme } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.full,
      overflow: 'hidden',
    };

    if (fullWidth) baseStyle.width = '100%';

    const sizeStyles: Record<string, ViewStyle> = {
      sm: { paddingVertical: 10, paddingHorizontal: 18, minHeight: 38 },
      md: { paddingVertical: 14, paddingHorizontal: 24, minHeight: 50 },
      lg: { paddingVertical: 16, paddingHorizontal: 32, minHeight: 56 },
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: disabled ? theme.colors.border : theme.colors.primary,
      },
      secondary: {
        backgroundColor: disabled ? theme.colors.border : theme.colors.secondary + '22',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.secondary + '40',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? theme.colors.border : theme.colors.primary + '60',
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyle = (): TextStyle => {
    const variantTextStyles: Record<string, TextStyle> = {
      primary: { color: '#FFFFFF' },
      secondary: { color: theme.colors.secondary },
      outline: { color: disabled ? theme.colors.textSecondary : theme.colors.primary },
      ghost: { color: disabled ? theme.colors.textSecondary : theme.colors.primary },
    };

    const sizeTextStyles: Record<string, TextStyle> = {
      sm: { fontSize: 13 },
      md: { fontSize: 15 },
      lg: { fontSize: 16 },
    };

    return {
      fontWeight: '500',
      letterSpacing: 0.1,
      textAlign: 'center',
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
      ...(textStyle as TextStyle),
    };
  };

  const iconColor =
    variant === 'primary'
      ? '#FFFFFF'
      : disabled
        ? theme.colors.textSecondary
        : theme.colors.primary;

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.72}
      accessibilityRole="button"
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} style={{ marginRight: 8 }} />
      ) : icon ? (
        <View style={{ marginRight: 8 }}>{icon}</View>
      ) : null}
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
};

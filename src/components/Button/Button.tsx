/**
 * Button - Componente de botón reutilizable
 *
 * Características:
 * - Variantes: primary, secondary, outline, ghost
 * - Tamaños: sm, md, lg
 * - Estados: disabled, loading
 * - Soporte para iconos
 * - Accesibilidad completa
 *
 * Uso:
 * <Button
 *   title="Iniciar sesión"
 *   onPress={handleLogin}
 *   variant="primary"
 *   size="lg"
 *   loading={isLoading}
 *   fullWidth
 * />
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  // Determinar estilos basados en variant y size
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: size === 'lg' ? theme.borderRadius.lg : theme.borderRadius.md,
      overflow: 'hidden',
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  const getContainerStyle = (): ViewStyle[] => {
    const styles: ViewStyle[] = [
      {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        borderWidth: variant === 'outline' ? 1 : 0,
      },
    ];

    // Sizes
    const sizeStyles: Record<string, ViewStyle> = {
      sm: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        minHeight: 40,
      },
      md: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        minHeight: 48,
      },
      lg: {
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
        minHeight: 56,
      },
    };

    styles.push(sizeStyles[size]);

    if (variant === 'outline') {
      styles.push({
        borderColor: disabled ? theme.colors.border : theme.colors.primary,
        backgroundColor: 'transparent',
      });
    } else if (variant === 'ghost') {
      styles.push({
        backgroundColor: 'transparent',
      });
    } else if (variant === 'secondary') {
      styles.push({
        backgroundColor: disabled ? theme.colors.border : theme.colors.secondary,
      });
    }

    return styles;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseTextStyle: TextStyle = {
      fontFamily: theme.typography.fontFamily.medium,
      fontWeight: '600',
      textAlign: 'center',
    };

    const sizeTextStyles: Record<string, TextStyle> = {
      sm: { fontSize: theme.typography.fontSize.sm },
      md: { fontSize: theme.typography.fontSize.md },
      lg: { fontSize: theme.typography.fontSize.lg },
    };

    const variantTextStyles: Record<string, TextStyle> = {
      primary: { color: theme.colors.textInverse },
      secondary: { color: theme.colors.textInverse },
      outline: { color: disabled ? theme.colors.textSecondary : theme.colors.primary },
      ghost: { color: disabled ? theme.colors.textSecondary : theme.colors.primary },
    };

    return [baseTextStyle, sizeTextStyles[size], variantTextStyles[variant], textStyle as TextStyle];
  };

  const getIconColor = (): string => {
    if (disabled) return theme.colors.textSecondary;
    switch (variant) {
      case 'primary':
      case 'secondary':
        return theme.colors.textInverse;
      case 'outline':
      case 'ghost':
        return theme.colors.primary;
      default:
        return theme.colors.primary;
    }
  };

  const renderContent = () => (
    <View style={getContainerStyle()}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getIconColor()}
          style={{ marginRight: theme.spacing.sm }}
        />
      ) : icon ? (
        <View style={{ marginRight: theme.spacing.sm }}>{icon}</View>
      ) : null}
      <Text style={getTextStyle()}>{title}</Text>
    </View>
  );

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      {...props}
    >
      {variant === 'primary' && !disabled ? (
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
        >
          {renderContent()}
        </LinearGradient>
      ) : (
        renderContent()
      )}
    </TouchableOpacity>
  );
};
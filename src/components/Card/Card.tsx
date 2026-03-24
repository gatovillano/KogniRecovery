/**
 * Card - Componente de tarjeta reutilizable
 *
 * Características:
 * - Variantes: elevated (sombra), outlined (borde), filled (fondo)
 * - Padding configurable
 * - Soporte para onPress (touchable)
 * - Estilos basados en tema
 *
 * Uso:
 * <Card variant="elevated" padding="md" onPress={handlePress}>
 *   <Text>Título</Text>
 *   <Text>Contenido de la tarjeta</Text>
 * </Card>
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
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
        ...theme.shadows.md,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      filled: {
        backgroundColor: theme.mode === 'dark' ? theme.colors.surface : theme.colors.background,
      },
    };

    const paddingStyles: Record<string, ViewStyle> = {
      sm: { padding: theme.spacing.sm },
      md: { padding: theme.spacing.md },
      lg: { padding: theme.spacing.lg },
    };

    const styles: ViewStyle[] = [baseStyle, variantStyles[variant], paddingStyles[padding]];
    if (style) {
      styles.push(StyleSheet.flatten(style));
    }
    return styles;
  };

  const content = <View style={styles.content}>{children}</View>;

  if (onPress) {
    return (
      <TouchableOpacity
        style={getCardStyle()}
        onPress={onPress}
        activeOpacity={0.7}
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

const styles = StyleSheet.create({
  content: {
    // flex: 1,
  },
});
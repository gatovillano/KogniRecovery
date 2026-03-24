/**
 * Avatar - Componente de avatar de usuario
 *
 * Características:
 * - Avatar de usuario
 * - Placeholder con iniciales
 * - Tamaño configurable
 * - Accesibilidad completa
 *
 * Uso:
 * <Avatar
 *   uri="https://..."
 *   name="Juan Pérez"
 *   size="lg"
 * />
 * 
 * <Avatar
 *   name="María González"
 *   size="md"
 * />
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@theme/ThemeContext';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  uri?: string;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  xs: 10,
  sm: 14,
  md: 20,
  lg: 28,
  xl: 40,
};

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  // Obtener las iniciales del nombre
  const getInitials = (fullName: string): string => {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  // Generar un color de fondo basado en el nombre
  const getBackgroundColor = (name?: string): string => {
    if (!name) return theme.colors.primary;
    
    // Generar un hash simple del nombre
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Colores pasteles agradables
    const colors = [
      '#4A90E2', // Azul
      '#52C41A', // Verde
      '#FFA940', // Naranja
      '#F06292', // Rosa
      '#7986CB', // Indigo
      '#4DB6AC', // Teal
      '#FFB74D', // Amber
      '#BA68C8', // Purple
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const dimension = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];

  const getContainerStyle = (): ViewStyle => {
    return {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
      backgroundColor: uri ? 'transparent' : getBackgroundColor(name),
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    };
  };

  const getImageStyle = (): ViewStyle => {
    return {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
    };
  };

  const getTextStyle = (): TextStyle => {
    return {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize,
      color: theme.colors.textInverse,
    };
  };

  return (
    <View
      style={[getContainerStyle(), style]}
      accessibilityRole="image"
      accessibilityLabel={name ? `Avatar de ${name}` : 'Avatar de usuario'}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={getImageStyle()}
          accessibilityLabel={name ? `Imagen de ${name}` : 'Avatar'}
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>
          {name ? getInitials(name) : '?'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Estilos adicionales si son necesarios
});

/**
 * Slider - Componente de slider para escalas (1-10)
 *
 * Características:
 * - Slider para escalas
 * - Para check-in de estado emocional
 * - Con labels y emojis
 * - Accesibilidad completa
 *
 * Uso:
 * <Slider
 *   label="¿Cómo te sientes hoy?"
 *   value={mood}
 *   onChange={setMood}
 *   min={1}
 *   max={10}
 *   labels={['Muy mal', 'Mal', 'Regular', 'Bien', 'Muy bien']}
 *   emojis={['😢', '😔', '😐', '🙂', '😊']}
 * />
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@theme/ThemeContext';

export interface SliderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  labels?: string[];
  emojis?: string[];
  disabled?: boolean;
  error?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

// Emojis por defecto para moods
const DEFAULT_EMOJIS = ['😢', '😔', '😐', '🙂', '😊'];

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  labels,
  emojis = DEFAULT_EMOJIS,
  disabled = false,
  error,
  style,
  labelStyle,
}) => {
  const { theme } = useTheme();

  // Calcular el rango de valores
  const range = max - min + 1;
  const normalizedValue = value - min;

  // Determinar el emoji a mostrar basado en el valor
  const getCurrentEmoji = (): string => {
    if (!emojis || emojis.length === 0) return '';
    const emojiIndex = Math.round((normalizedValue / (range - 1)) * (emojis.length - 1));
    return emojis[Math.min(emojiIndex, emojis.length - 1)];
  };

  // Determinar el label a mostrar basado en el valor
  const getCurrentLabel = (): string => {
    if (!labels || labels.length === 0) return '';
    const labelIndex = Math.round((normalizedValue / (range - 1)) * (labels.length - 1));
    return labels[Math.min(labelIndex, labels.length - 1)];
  };

  const handlePress = (newValue: number) => {
    if (!disabled) {
      onChange(newValue);
    }
  };

  const getContainerStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle = {
      marginBottom: theme.spacing.md,
    };
    const styles: ViewStyle[] = [baseStyle];
    if (style) {
      styles.push(style);
    }
    return styles;
  };

  const getLabelStyle = (): TextStyle => {
    return {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.sm,
      color: error ? theme.colors.error : theme.colors.text,
      marginBottom: theme.spacing.sm,
    };
  };

  const getValueContainerStyle = (): ViewStyle => {
    return {
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    };
  };

  const getEmojiStyle = (): TextStyle => {
    return {
      fontSize: 48,
      marginBottom: theme.spacing.xs,
    };
  };

  const getValueLabelStyle = (): TextStyle => {
    return {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.primary,
    };
  };

  const getSliderTrackStyle = (): ViewStyle => {
    return {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      height: 8,
      position: 'relative',
    };
  };

  const getSliderFillStyle = (): ViewStyle => {
    const percentage = (normalizedValue / (range - 1)) * 100;
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: `${percentage}%`,
      backgroundColor: disabled ? theme.colors.textSecondary : theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
    };
  };

  const getButtonsContainerStyle = (): ViewStyle => {
    return {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.md,
    };
  };

  const getButtonStyle = (isActive: boolean): ViewStyle => {
    return {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isActive
        ? theme.colors.primary
        : disabled
        ? theme.colors.border
        : theme.colors.surface,
      borderWidth: isActive ? 0 : 1,
      borderColor: theme.colors.border,
    };
  };

  const getButtonTextStyle = (isActive: boolean): TextStyle => {
    return {
      fontSize: 14,
      fontWeight: '600',
      color: isActive
        ? theme.colors.textInverse
        : disabled
        ? theme.colors.textSecondary
        : theme.colors.text,
    };
  };

  const getErrorStyle = (): TextStyle => {
    return {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    };
  };

  // Generar los botones para cada valor
  const renderButtons = () => {
    const buttons = [];
    for (let i = min; i <= max; i += step) {
      const isActive = i === value;
      buttons.push(
        <TouchableOpacity
          key={i}
          onPress={() => handlePress(i)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Valor ${i}`}
          accessibilityState={{ selected: isActive, disabled }}
          style={getButtonStyle(isActive)}
        >
          <Text style={getButtonTextStyle(isActive)}>{i}</Text>
        </TouchableOpacity>
      );
    }
    return buttons;
  };

  return (
    <View style={getContainerStyle()}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      
      <View style={getValueContainerStyle()}>
        <Text style={getEmojiStyle()}>{getCurrentEmoji()}</Text>
        <Text style={getValueLabelStyle()}>{getCurrentLabel() || value.toString()}</Text>
      </View>

      {/* Track con fill */}
      <View style={getSliderTrackStyle()}>
        <View style={getSliderFillStyle()} />
      </View>

      {/* Botones de selección */}
      <View style={getButtonsContainerStyle()}>
        {renderButtons()}
      </View>

      {error && <Text style={getErrorStyle()}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  // Estilos adicionales si son necesarios
});

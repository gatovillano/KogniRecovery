/**
 * PasswordInput - Componente de input de contraseña con toggle mostrar/ocultar
 *
 * Características:
 * - Toggle para mostrar/ocultar contraseña
 * - Icono de ojo
 * - Compatible con el Input existente
 * - Accesibilidad completa
 *
 * Uso:
 * <PasswordInput
 *   label="Contraseña"
 *   value={password}
 *   onChangeText={setPassword}
 *   error={passwordError}
 *   placeholder="Ingresa tu contraseña"
 * />
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '@theme/ThemeContext';

export interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  const { theme } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
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
      marginBottom: theme.spacing.xs,
    };
  };

  const getInputContainerStyle = (): ViewStyle => {
    return {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: disabled ? theme.colors.border : theme.colors.surface,
      borderWidth: 1,
      borderColor: error
        ? theme.colors.error
        : disabled
        ? theme.colors.border
        : theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      minHeight: 44,
    };
  };

  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      flex: 1,
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.md,
      color: disabled ? theme.colors.textSecondary : theme.colors.text,
      paddingVertical: theme.spacing.sm,
    };
    return textStyle ? { ...baseStyle, ...textStyle } : baseStyle;
  };

  const getErrorStyle = (): TextStyle => {
    return {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    };
  };

  const getEyeIconColor = (): string => {
    if (disabled) return theme.colors.textSecondary;
    return isPasswordVisible ? theme.colors.primary : theme.colors.textSecondary;
  };

  return (
    <View style={getContainerStyle()}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      <View style={getInputContainerStyle()}>
        <TextInput
          style={getInputStyle()}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!isPasswordVisible}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
          accessibilityHint={placeholder}
          accessibilityState={{ disabled }}
          {...props}
        />
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          accessibilityState={{ disabled }}
          style={styles.eyeButton}
        >
          <Text style={{ color: getEyeIconColor(), fontSize: 20 }}>
            {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
          </Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={getErrorStyle()}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  eyeButton: {
    padding: 4,
  },
});

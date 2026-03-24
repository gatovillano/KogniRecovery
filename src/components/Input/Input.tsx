/**
 * Input - Componente de input de texto reutilizable
 *
 * Características:
 * - Label opcional
 * - Mensaje de error
 * - Soporte para multiline
 * - Iconos (izquierda/derecha)
 * - Accesibilidad completa
 * - Estilos basados en tema
 *
 * Uso:
 * <Input
 *   label="Correo electrónico"
 *   placeholder="tu@email.com"
 *   value={email}
 *   onChangeText={setEmail}
 *   error={emailError}
 *   keyboardType="email-address"
 *   autoCapitalize="none"
 * />
 */

import React, { forwardRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { InputProps } from '@types';

export const Input = forwardRef<TextInput, InputProps & TextInputProps>(
  (
    {
      label,
      placeholder,
      value,
      onChangeText,
      error,
      secureTextEntry = false,
      multiline = false,
      numberOfLines = 1,
      disabled = false,
      keyboardType = 'default',
      autoCapitalize = 'sentences',
      style,
      textStyle,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const getContainerStyle = (): any => {
      return [
        { marginBottom: theme.spacing.md },
        style
      ];
    };

    const getLabelStyle = (): TextStyle => {
      return {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: '600',
        color: error ? theme.colors.error : isFocused ? theme.colors.primary : theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
        marginLeft: 4,
      };
    };

    const getInputContainerStyle = (): ViewStyle => {
      return {
        flexDirection: 'row',
        alignItems: multiline ? 'flex-start' : 'center',
        backgroundColor: disabled
          ? theme.colors.background
          : theme.colors.surface,
        borderWidth: 1.5,
        borderColor: error
          ? theme.colors.error
          : isFocused 
            ? theme.colors.primary 
            : theme.colors.border,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: multiline ? theme.spacing.md : 0,
        minHeight: multiline ? 100 : 54, // Un poco más alto para modernidad
      };
    };

    const getInputStyle = (): TextStyle => {
      const baseStyle: TextStyle = {
        flex: 1,
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: theme.typography.fontSize.md,
        color: disabled ? theme.colors.textSecondary : theme.colors.text,
        textAlignVertical: multiline ? 'top' : 'center',
        paddingVertical: multiline ? 0 : 0,
      };
      return StyleSheet.flatten([baseStyle, textStyle as TextStyle]);
    };

    const getErrorStyle = (): TextStyle => {
      return {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.error,
        marginTop: theme.spacing.xs,
        marginLeft: 4,
      };
    };

    return (
      <View style={getContainerStyle()}>
        {label && <Text style={getLabelStyle()}>{label}</Text>}
        <View style={getInputContainerStyle()}>
          <TextInput
            ref={ref}
            style={getInputStyle()}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textSecondary + '70'}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            multiline={multiline}
            numberOfLines={numberOfLines}
            editable={!disabled}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            accessibilityLabel={label}
            accessibilityHint={placeholder}
            accessibilityState={{ disabled }}
            {...props}
          />
        </View>
        {error && <Text style={getErrorStyle()}>{error}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';
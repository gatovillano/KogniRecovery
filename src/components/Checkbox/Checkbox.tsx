/**
 * Checkbox - Componente de checkbox personalizado para términos y condiciones
 *
 * Características:
 * - Estados: checked, unchecked, disabled
 * - Con label
 * - Accesibilidad completa
 *
 * Uso:
 * <Checkbox
 *   label="Acepto los términos y condiciones"
 *   checked={accepted}
 *   onChange={setAccepted}
 *   disabled={isLoading}
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

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
  error,
  style,
  labelStyle,
}) => {
  const { theme } = useTheme();

  const handlePress = () => {
    if (!disabled) {
      onChange(!checked);
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

  const getCheckboxContainerStyle = (): ViewStyle => {
    return {
      width: 24,
      height: 24,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 2,
      borderColor: disabled
        ? theme.colors.border
        : checked
        ? theme.colors.primary
        : error
        ? theme.colors.error
        : theme.colors.textSecondary,
      backgroundColor: checked ? theme.colors.primary : 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    };
  };

  const getLabelStyle = (): TextStyle => {
    return {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.md,
      color: disabled ? theme.colors.textSecondary : theme.colors.text,
      flex: 1,
      marginLeft: theme.spacing.md,
    };
  };

  const getErrorStyle = (): TextStyle => {
    return {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
      marginLeft: 24 + theme.spacing.md,
    };
  };

  return (
    <View style={getContainerStyle()}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityLabel={label}
        style={styles.row}
      >
        <View style={getCheckboxContainerStyle()}>
          {checked && (
            <Text style={{ color: theme.colors.textInverse, fontSize: 14, fontWeight: 'bold' }}>
              ✓
            </Text>
          )}
        </View>
        <Text style={[getLabelStyle(), labelStyle]}>{label}</Text>
      </TouchableOpacity>
      {error && <Text style={getErrorStyle()}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

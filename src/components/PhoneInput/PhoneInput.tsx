/**
 * PhoneInput - Componente de input de teléfono con selector de país
 *
 * Características:
 * - Input de teléfono con selector de país
 * - Formato automático
 * - Prefijo internacional
 * - Accesibilidad completa
 *
 * Uso:
 * <PhoneInput
 *   label="Teléfono"
 *   value={phone}
 *   onChange={setPhone}
 *   selectedCountry={country}
 *   onCountryChange={setCountry}
 * />
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@theme/ThemeContext';

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

// Lista de países comunes con prefijos internacionales
export const COUNTRIES: Country[] = [
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
];

export interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (phone: string) => void;
  selectedCountry?: Country;
  onCountryChange?: (country: Country) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value,
  onChange,
  selectedCountry = COUNTRIES[0],
  onCountryChange,
  placeholder = '9 1234 5678',
  error,
  disabled = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const [isCountrySelectorOpen, setIsCountrySelectorOpen] = useState(false);

  const formatPhoneNumber = (text: string): string => {
    // Eliminar caracteres no numéricos
    const cleaned = text.replace(/\D/g, '');
    return cleaned;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    onChange(formatted);
  };

  const openCountrySelector = () => {
    if (!disabled && onCountryChange) {
      setIsCountrySelectorOpen(true);
    }
  };

  const closeCountrySelector = () => {
    setIsCountrySelectorOpen(false);
  };

  const handleCountrySelect = (country: Country) => {
    if (onCountryChange) {
      onCountryChange(country);
    }
    closeCountrySelector();
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

  const getCountryButtonStyle = (): ViewStyle => {
    return {
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: theme.spacing.sm,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
      marginRight: theme.spacing.sm,
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

  return (
    <View style={getContainerStyle()}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      <View style={getInputContainerStyle()}>
        {onCountryChange ? (
          <TouchableOpacity
            onPress={openCountrySelector}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`Seleccionar país. Actual: ${selectedCountry.name}`}
            style={getCountryButtonStyle()}
          >
            <Text style={{ fontSize: 20, marginRight: 4 }}>{selectedCountry.flag}</Text>
            <Text style={{ color: theme.colors.text, fontSize: 16 }}>{selectedCountry.dialCode}</Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginLeft: 4 }}>▼</Text>
          </TouchableOpacity>
        ) : (
          <View style={getCountryButtonStyle()}>
            <Text style={{ fontSize: 20, marginRight: 4 }}>{selectedCountry.flag}</Text>
            <Text style={{ color: theme.colors.text, fontSize: 16 }}>{selectedCountry.dialCode}</Text>
          </View>
        )}
        <TextInput
          style={getInputStyle()}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          value={value}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          editable={!disabled}
          accessibilityLabel={label}
          accessibilityHint={placeholder}
          accessibilityState={{ disabled }}
        />
      </View>
      {error && <Text style={getErrorStyle()}>{error}</Text>}

      <Modal visible={isCountrySelectorOpen} transparent animationType="fade" onRequestClose={closeCountrySelector}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.overlayTouch}
            onPress={closeCountrySelector}
            activeOpacity={1}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Seleccionar país</Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleCountrySelect(item)}
                  style={[
                    styles.countryOption,
                    {
                      backgroundColor:
                        item.code === selectedCountry.code
                          ? theme.colors.primary + '20'
                          : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{item.flag}</Text>
                  <Text style={[styles.countryName, { color: theme.colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.dialCode, { color: theme.colors.textSecondary }]}>
                    {item.dialCode}
                  </Text>
                  {item.code === selectedCountry.code && (
                    <Text style={{ color: theme.colors.primary, marginLeft: 8 }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              style={styles.countriesList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  countriesList: {
    maxHeight: 400,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
  },
  dialCode: {
    fontSize: 14,
  },
});

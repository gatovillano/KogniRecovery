/**
 * Select - Componente de selector dropdown para país, rol, etc.
 *
 * Características:
 * - Selector dropdown
 * - Compatible con el theme existente
 * - Animación de apertura
 * - Accesibilidad completa
 *
 * Uso:
 * <Select
 *   label="País"
 *   value={country}
 *   onChange={setCountry}
 *   options={[
 *     { label: 'Chile', value: 'cl' },
 *     { label: 'Argentina', value: 'ar' },
 *   ]}
 *   placeholder="Selecciona un país"
 * />
 */

import React, { useState, useMemo } from 'react';
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
  Animated,
} from 'react-native';
import { useTheme } from '@theme/ThemeContext';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecciona una opción',
  error,
  disabled = false,
  style,
  labelStyle,
  searchable = false,
  searchPlaceholder = 'Buscar...',
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) => opt.label.toLowerCase().includes(query) || opt.value.toLowerCase().includes(query)
    );
  }, [options, searchQuery, searchable]);

  const openSelect = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearchQuery('');
      Animated.timing(animation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const closeSelect = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false);
      setSearchQuery('');
    });
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    closeSelect();
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

  const getSelectContainerStyle = (): ViewStyle => {
    return {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: disabled ? theme.colors.border : theme.colors.surface,
      borderWidth: 1,
      borderColor: error
        ? theme.colors.error
        : disabled
          ? theme.colors.border
          : theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      minHeight: 44,
    };
  };

  const getSelectTextStyle = (): TextStyle => {
    return {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.md,
      color: selectedOption ? theme.colors.text : theme.colors.textSecondary,
      flex: 1,
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

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const listScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  return (
    <View style={getContainerStyle()}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      <TouchableOpacity
        onPress={openSelect}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
        accessibilityState={{ disabled }}
        style={getSelectContainerStyle()}
      >
        <Text style={getSelectTextStyle()}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>▼</Text>
      </TouchableOpacity>
      {error && <Text style={getErrorStyle()}>{error}</Text>}

      <Modal visible={isOpen} transparent animationType="none" onRequestClose={closeSelect}>
        <Animated.View style={[styles.modalOverlay, { opacity: backdropOpacity }]}>
          <TouchableOpacity style={styles.overlayTouch} onPress={closeSelect} activeOpacity={1} />
        </Animated.View>
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              transform: [{ scale: listScale }],
            },
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            {label || placeholder}
          </Text>
          {searchable && (
            <View
              style={[
                styles.searchContainer,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
              ]}
            >
              <Text style={{ marginRight: 8, fontSize: 16 }}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item.value)}
                style={[
                  styles.option,
                  {
                    backgroundColor:
                      item.value === value ? theme.colors.primary + '20' : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: item.value === value ? theme.colors.primary : theme.colors.text,
                    },
                  ]}
                >
                  {item.label}
                </Text>
                {item.value === value && <Text style={{ color: theme.colors.primary }}>✓</Text>}
              </TouchableOpacity>
            )}
            style={styles.optionsList}
          />
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
});

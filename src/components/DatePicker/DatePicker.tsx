/**
 * DatePicker - Componente de selector de fecha (para fecha de nacimiento)
 *
 * Características:
 * - Selector de fecha
 * - Compatible con Expo
 * - Accesibilidad completa
 *
 * Uso:
 * <DatePicker
 *   label="Fecha de nacimiento"
 *   value={birthDate}
 *   onChange={setBirthDate}
 *   maximumDate={new Date()}
 * />
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
  Animated,
} from 'react-native';
import { useTheme } from '@theme/ThemeContext';

export interface DatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

// Días del mes
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
// Meses del año
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
// Años desde 1900 hasta el año actual
const getYears = (minYear: number = 1900) => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - minYear + 1 }, (_, i) => currentYear - i);
};

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Selecciona una fecha',
  error,
  disabled = false,
  minimumDate,
  maximumDate = new Date(),
  style,
  labelStyle,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const currentYear = new Date().getFullYear();
  const minYear = minimumDate?.getFullYear() || 1900;
  const years = getYears(minYear);

  // Estado interno para la selección
  const [selectedDay, setSelectedDay] = useState(value?.getDate() || 1);
  const [selectedMonth, setSelectedMonth] = useState(value?.getMonth() || 0);
  const [selectedYear, setSelectedYear] = useState(value?.getFullYear() || currentYear);

  const openPicker = () => {
    if (!disabled) {
      setIsOpen(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const closePicker = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  };

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    
    // Validar mínimo
    if (minimumDate && newDate < minimumDate) {
      return;
    }
    
    // Validar máximo
    if (maximumDate && newDate > maximumDate) {
      return;
    }
    
    onChange(newDate);
    closePicker();
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
      paddingVertical: theme.spacing.md,
      minHeight: 44,
    };
  };

  const getInputTextStyle = (): TextStyle => {
    return {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.md,
      color: value ? theme.colors.text : theme.colors.textSecondary,
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

  const contentScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  return (
    <View style={getContainerStyle()}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      <TouchableOpacity
        onPress={openPicker}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
        accessibilityState={{ disabled }}
        style={getInputContainerStyle()}
      >
        <Text style={getInputTextStyle()}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 18 }}>📅</Text>
      </TouchableOpacity>
      {error && <Text style={getErrorStyle()}>{error}</Text>}

      <Modal visible={isOpen} transparent animationType="none" onRequestClose={closePicker}>
        <Animated.View
          style={[
            styles.modalOverlay,
            { opacity: backdropOpacity },
          ]}
        >
          <TouchableOpacity
            style={styles.overlayTouch}
            onPress={closePicker}
            activeOpacity={1}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              transform: [{ scale: contentScale }],
            },
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            {label || 'Seleccionar fecha'}
          </Text>

          <View style={styles.pickerContainer}>
            {/* Día */}
            <View style={styles.pickerColumn}>
              <Text style={[styles.columnLabel, { color: theme.colors.textSecondary }]}>Día</Text>
              <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                {DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    style={[
                      styles.pickerItem,
                      {
                        backgroundColor:
                          day === selectedDay ? theme.colors.primary : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        {
                          color:
                            day === selectedDay ? theme.colors.textInverse : theme.colors.text,
                        },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Mes */}
            <View style={styles.pickerColumn}>
              <Text style={[styles.columnLabel, { color: theme.colors.textSecondary }]}>Mes</Text>
              <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                {MONTHS.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    onPress={() => setSelectedMonth(index)}
                    style={[
                      styles.pickerItem,
                      {
                        backgroundColor:
                          index === selectedMonth ? theme.colors.primary : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        {
                          color:
                            index === selectedMonth ? theme.colors.textInverse : theme.colors.text,
                        },
                      ]}
                    >
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Año */}
            <View style={styles.pickerColumn}>
              <Text style={[styles.columnLabel, { color: theme.colors.textSecondary }]}>Año</Text>
              <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    onPress={() => setSelectedYear(year)}
                    style={[
                      styles.pickerItem,
                      {
                        backgroundColor:
                          year === selectedYear ? theme.colors.primary : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        {
                          color:
                            year === selectedYear ? theme.colors.textInverse : theme.colors.text,
                        },
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={closePicker}
              style={[
                styles.button,
                { borderColor: theme.colors.border, borderWidth: 1 },
              ]}
            >
              <Text style={{ color: theme.colors.text }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[
                styles.button,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={{ color: theme.colors.textInverse, fontWeight: '600' }}>
                Confirmar
              </Text>
            </TouchableOpacity>
          </View>
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
    width: '90%',
    maxHeight: '70%',
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
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 200,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  columnLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  picker: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});

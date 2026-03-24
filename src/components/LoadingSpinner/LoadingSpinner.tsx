/**
 * LoadingSpinner - Componente de carga reutilizable
 *
 * Características:
 * - Tamaños configurables: sm, md, lg
 * - Color personalizable o basado en tema
 * - Modo full-screen con overlay
 * - Accesibilidad completa
 *
 * Uso:
 * // Spinner simple
 * <LoadingSpinner size="md" />
 *
 * // Spinner full-screen
 * <LoadingSpinner fullScreen />
 */

import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  Modal,
} from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { LoadingSpinnerProps } from '@types';

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color,
  fullScreen = false,
  text,
}) => {
  const { theme } = useTheme();

  // Determinar tamaño del ActivityIndicator
  const getIndicatorSize = (): 'small' | 'large' => {
    switch (size) {
      case 'sm':
        return 'small';
      case 'lg':
        return 'large';
      case 'md':
      default:
        return 'large';
    }
  };

  // Determinar color
  const spinnerColor = color || theme.colors.primary;

  // Spinner simple
  const spinner = (
    <ActivityIndicator
      size={getIndicatorSize()}
      color={spinnerColor}
      animating={true}
    />
  );

  // Si es fullScreen, mostrar con overlay
  if (fullScreen) {
    return (
      <Modal
        visible={true}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <View style={[styles.fullScreenOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={styles.fullScreenContainer}>
            {spinner}
            {text && (
              <View style={styles.textContainer}>
                <Text style={[styles.text, { color: theme.colors.textInverse }]}>
                  {text}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // Spinner inline
  return spinner;
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 120,
  },
  textContainer: {
    marginTop: 16,
  },
  text: {
    fontFamily: 'System',
    fontSize: 14,
    textAlign: 'center',
  },
});
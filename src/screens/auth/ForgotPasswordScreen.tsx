/**
 * ForgotPasswordScreen - Pantalla de recuperación de contraseña
 *
 * NOTA: Esta es una implementación placeholder.
 * Se implementará completamente en el sprint correspondiente.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/ThemeContext';

export const ForgotPasswordScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Recuperar Contraseña
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Pantalla en desarrollo
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
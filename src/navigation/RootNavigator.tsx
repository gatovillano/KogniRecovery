/**
 * RootNavigator - Navegador raíz con protección de rutas
 *
 * Decisiones de arquitectura:
 * 1. Usa Conditional Rendering basado en authStore.isAuthenticated
 * 2. Separación clara entre flujos de autenticación y app principal
 * 3. Protected routes implementadas a nivel de navegador raíz
 * 4. Transición suave entre Auth y Main (se puede mejorar con splash screen)
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@theme/ThemeContext';
import { authStore } from '@store/authStore';
import apiClient from '@services/api';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Componente de loading mientras se verifica autenticación
 */
const LoadingScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
};

/**
 * RootNavigator - Decide qué navegador mostrar basado en autenticación
 */
export const RootNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading, token } = authStore();
  const [isReady, setIsReady] = useState(false);

  // Verificar token al iniciar y establecer callbacks de sesión
  useEffect(() => {
    // Escuchar cuando la sesión expira a nivel API (Error 401)
    apiClient.setOnUnauthorized(() => {
      // Usamos setState directamente en lugar de authStore().logout() para evitar llamadas recursivas a la API y loops de 401
      authStore.setState({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        error: 'Tu sesión ha expirado, por favor ingresa nuevamente.',
      });
    });

    // Escuchar cuando se refrescan los tokens para guardarlos en el store (persistencia)
    apiClient.setOnTokensRefreshed((tokens) => {
      authStore.setState({
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    });

    const bootstrapAsync = async () => {
      try {
        // Al iniciar, sincronizar el token de Zustand con el cliente API
        const { token, refreshToken } = authStore.getState();
        if (token) {
          apiClient.setAuthTokens({
            accessToken: token,
            refreshToken: refreshToken || '',
            expiresAt: Date.now() + 3600000, // Asumimos 1h si estamos restaurando
          });
        }

        // Pequeño delay para simular verificación de token
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('Error during bootstrap:', e);
      } finally {
        setIsReady(true);
      }
    };

    bootstrapAsync();
  }, []);

  // Mientras se carga, mostrar loading
  if (!isReady || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Stack de autenticación
        <Stack.Screen name="Auth">
          {() => <AuthNavigator />}
        </Stack.Screen>
      ) : (
        // Navegación principal con tabs
        <Stack.Screen name="Main">
          {() => <MainTabNavigator />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
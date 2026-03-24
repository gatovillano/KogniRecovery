/**
 * AuthNavigator - Navegación de autenticación
 *
 * Stack navigation para pantallas de login, registro, etc.
 * Solo se muestra cuando el usuario NO está autenticado
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '@theme/ThemeContext';
import { AuthStackParamList } from './types';

// Importar pantallas
import { LoginScreen, RegisterScreen, ForgotPasswordScreen } from '@screens';

const Stack = createStackNavigator<AuthStackParamList>();

/**
 * Configuración de opciones de pantalla basadas en el tema
 */
const getScreenOptions = (isDark: boolean) => ({
  headerStyle: {
    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333333' : '#E5E7EB',
  },
  headerTintColor: isDark ? '#F0F0F0' : '#1A1A1A',
  headerTitleStyle: {
    fontWeight: '600' as const,
    fontSize: 18,
  },
  headerBackTitleVisible: false,
  cardStyle: {
    backgroundColor: isDark ? '#121212' : '#F5F7FA',
  },
  cardOverlayEnabled: true,
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
});

export const AuthNavigator: React.FC = () => {
  const { isDark } = useTheme();
  const screenOptions = getScreenOptions(isDark);

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={screenOptions}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: 'Crear cuenta',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          title: 'Recuperar contraseña',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};
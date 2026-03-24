import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@theme/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '@navigation/RootNavigator';

/**
 * KogniRecovery - App de acompañamiento en adicciones
 *
 * Arquitectura:
 * - ThemeProvider: Proporciona tema (claro/oscuro) y tokens de diseño
 * - NavigationContainer: Contenedor principal de navegación
 * - RootNavigator: Maneja AuthStack y MainTabs según estado de autenticación
 *
 * NOTA: Esta es la estructura base. Las pantallas específicas se implementarán
 * en sprints posteriores.
 */

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
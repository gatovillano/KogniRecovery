import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@theme/ThemeContext';
import { NavigationContainer, NavigationContainerRef, CommonActions } from '@react-navigation/native';
import { RootNavigator } from '@navigation/RootNavigator';
import * as Notifications from 'expo-notifications';
import { configureNotificationHandler } from '@services/notificationService';

// Configurar el handler de notificaciones ANTES de que la app se monte
configureNotificationHandler();

/**
 * KogniRecovery - App de acompañamiento en adicciones
 *
 * Arquitectura:
 * - ThemeProvider: Proporciona tema (claro/oscuro) y tokens de diseño
 * - NavigationContainer: Contenedor principal de navegación
 * - RootNavigator: Maneja AuthStack y MainTabs según estado de autenticación
 */

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    // Cuando el usuario toca la notificación → navegar a la pantalla de medicamentos
    const subscription = Notifications.addNotificationResponseReceivedListener(
      response => {
        const data = response.notification.request.content.data;
        if (data?.type === 'medication_reminder' && navigationRef.current) {
          navigationRef.current.dispatch(
            CommonActions.navigate({ name: 'Medications' })
          );
        }
      }
    );
    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationContainer ref={navigationRef}>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
/**
 * MainTabNavigator - Navegación principal con bottom tabs
 *
 * Contiene las 4 secciones principales de la app:
 * - Dashboard: Resumen de progreso
 * - CheckIn: Registro diario
 * - Chatbot: Asistente IA
 * - Profile: Perfil y configuración
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@theme/ThemeContext';
import { MainTabParamList, ProfileStackParamList } from './types';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from '@expo/vector-icons/Ionicons';

// Importar pantallas
import { DashboardScreen, CheckInScreen, ChatbotScreen, ProfileScreen, AISettingsScreen, IntelligenceProfileScreen } from '@screens';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

/**
 * Navegador de Perfil (Stack)
 */
const ProfileNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
      }}
    >
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: 'Mi Perfil' }}
      />
      <ProfileStack.Screen
        name="AISettings"
        component={AISettingsScreen}
        options={{ title: 'Ajustes de IA' }}
      />
      <ProfileStack.Screen
        name="IntelligenceProfile"
        component={IntelligenceProfileScreen}
        options={{ title: 'Memoria de LÚA' }}
      />
    </ProfileStack.Navigator>
  );
};

/**
 * Configuración de iconos y etiquetas para cada tab
 */
const TAB_CONFIG = {
  Dashboard: {
    icon: 'home-outline',
    iconFilled: 'home',
    label: 'Inicio',
  },
  CheckIn: {
    icon: 'journal-outline',
    iconFilled: 'journal',
    label: 'Bitácora',
  },
  Chatbot: {
    icon: 'chatbubble-outline',
    iconFilled: 'chatbubble',
    label: 'Chatbot',
  },
  Profile: {
    icon: 'person-outline',
    iconFilled: 'person',
    label: 'Perfil',
  },
} as const;

/**
 * Componente de Tab Icon personalizado
 */
const TabIcon: React.FC<{
  name: string;
  focused: boolean;
  color: string;
  size: number;
}> = ({ name, focused, color, size }) => {
  return <Icon name={focused ? name.replace('-outline', '') as any : name as any} size={size} color={color} />;
};

export const MainTabNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();

  const screenOptions = {
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: isDark ? '#A0A0A0' : '#6B7280',
    tabBarStyle: {
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      paddingTop: 8,
      height: undefined, // Dejar que el Safe Area maneje el alto
      minHeight: 60,
      paddingBottom: 8, // Este padding se sumará al bottom inset de SafeArea
      elevation: 8,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: -2 },
      shadowRadius: 4,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500' as const,
      marginBottom: 4,
    },
    headerShown: false,
  };

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name={TAB_CONFIG.Dashboard.icon}
              focused={focused}
              color={color}
              size={size}
            />
          ),
          tabBarLabel: TAB_CONFIG.Dashboard.label,
        }}
      />
      <Tab.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name={TAB_CONFIG.CheckIn.icon}
              focused={focused}
              color={color}
              size={size}
            />
          ),
          tabBarLabel: TAB_CONFIG.CheckIn.label,
        }}
      />
      <Tab.Screen
        name="Chatbot"
        component={ChatbotScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name={TAB_CONFIG.Chatbot.icon}
              focused={focused}
              color={color}
              size={size}
            />
          ),
          tabBarLabel: TAB_CONFIG.Chatbot.label,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name={TAB_CONFIG.Profile.icon}
              focused={focused}
              color={color}
              size={size}
            />
          ),
          tabBarLabel: TAB_CONFIG.Profile.label,
        }}
      />
    </Tab.Navigator>
  );
};
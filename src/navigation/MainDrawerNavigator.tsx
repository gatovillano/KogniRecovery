/**
 * MainDrawerNavigator - Navegación principal con sidebar desplegable
 *
 * Contiene las mismas secciones que el bottom tabs original:
 * - Dashboard: Resumen de progreso
 * - CheckIn: Registro diario
 * - Chatbot: Asistente IA
 * - Profile: Perfil y configuración
 */

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from '@theme/ThemeContext';
import {
  MainTabParamList,
  ProfileStackParamList,
  CheckInStackParamList,
  NotesStackParamList,
} from './types';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';

// Importar pantallas
import {
  DashboardScreen,
  CheckInScreen,
  ChatbotScreen,
  ProfileScreen,
  AISettingsScreen,
  IntelligenceProfileScreen,
  MedicationScreen,
  NotesScreen,
  NoteDetailScreen,
  ProgressScreen,
  SubstanceExpenseScreen,
  SubstanceDoseScreen,
} from '@screens';

const Drawer = createDrawerNavigator<MainTabParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const NotesStack = createNativeStackNavigator<NotesStackParamList>();

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
 * Navegador de Notas (Stack)
 */
const NotesNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <NotesStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <NotesStack.Screen name="NotesHome" component={NotesScreen} />
      <NotesStack.Screen
        name="NoteDetail"
        component={NoteDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </NotesStack.Navigator>
  );
};

const CheckInStack = createNativeStackNavigator<CheckInStackParamList>();

/**
 * Navegador de Bitácora (Stack)
 */
const CheckInNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <CheckInStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <CheckInStack.Screen name="CheckInHome" component={CheckInScreen} />
      <CheckInStack.Screen name="Progress" component={ProgressScreen} />
      <CheckInStack.Screen name="SubstanceExpense" component={SubstanceExpenseScreen} />
      <CheckInStack.Screen name="SubstanceDose" component={SubstanceDoseScreen} />
    </CheckInStack.Navigator>
  );
};

/**
 * Configuración de iconos y etiquetas para cada sección
 */
const DRAWER_CONFIG = {
  Dashboard: {
    icon: 'home-outline',
    label: 'Inicio',
  },
  CheckIn: {
    icon: 'journal-outline',
    label: 'Bitácora',
  },
  Medications: {
    icon: 'medkit-outline',
    label: 'Medicamentos',
  },
  Notes: {
    icon: 'document-text-outline',
    label: 'Notas',
  },
  Chatbot: {
    icon: 'chatbubble-outline',
    label: 'Chatbot',
  },
  Profile: {
    icon: 'person-outline',
    label: 'Perfil',
  },
} as const;

/**
 * Componente de Drawer Icon personalizado
 */
const DrawerIcon: React.FC<{
  name: string;
  color: string;
  size: number;
}> = ({ name, color, size }) => {
  return <Icon name={name as any} size={size} color={color} />;
};

export const MainDrawerNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();

  const screenOptions = {
    drawerActiveTintColor: theme.colors.primary,
    drawerInactiveTintColor: isDark ? '#A0A0A0' : '#6B7280',
    drawerStyle: {
      backgroundColor: theme.colors.surface,
      width: 280,
    },
    drawerLabelStyle: {
      fontSize: 16,
      fontWeight: '500' as const,
      marginLeft: -10,
    },
    drawerIconStyle: {
      marginRight: 10,
    },
    headerStyle: {
      backgroundColor: theme.colors.surface,
    },
    headerTintColor: theme.colors.text,
    headerShadowVisible: false,
    headerShown: true,
  };

  return (
    <Drawer.Navigator screenOptions={screenOptions}>
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: DRAWER_CONFIG.Dashboard.label,
          drawerIcon: ({ color, size }) => (
            <DrawerIcon name={DRAWER_CONFIG.Dashboard.icon} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="CheckIn"
        component={CheckInNavigator}
        options={{
          title: DRAWER_CONFIG.CheckIn.label,
          drawerIcon: ({ color, size }) => (
            <DrawerIcon name={DRAWER_CONFIG.CheckIn.icon} color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="Medications"
        component={MedicationScreen}
        options={{
          title: DRAWER_CONFIG.Medications.label,
          drawerIcon: ({ color, size }) => (
            <DrawerIcon name={DRAWER_CONFIG.Medications.icon} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Notes"
        component={NotesNavigator}
        options={{
          title: DRAWER_CONFIG.Notes.label,
          drawerIcon: ({ color, size }) => (
            <DrawerIcon name={DRAWER_CONFIG.Notes.icon} color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="Chatbot"
        component={ChatbotScreen}
        options={{
          title: DRAWER_CONFIG.Chatbot.label,
          drawerIcon: ({ color, size }) => (
            <DrawerIcon name={DRAWER_CONFIG.Chatbot.icon} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          title: DRAWER_CONFIG.Profile.label,
          drawerIcon: ({ color, size }) => (
            <DrawerIcon name={DRAWER_CONFIG.Profile.icon} color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
    </Drawer.Navigator>
  );
};

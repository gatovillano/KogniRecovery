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

const Tab = createBottomTabNavigator<MainTabParamList>();
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
  Medications: {
    icon: 'medkit-outline',
    iconFilled: 'medkit',
    label: 'Medics',
  },
  Notes: {
    icon: 'document-text-outline',
    iconFilled: 'document-text',
    label: 'Notas',
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
  return (
    <Icon
      name={focused ? (name.replace('-outline', '') as any) : (name as any)}
      size={size}
      color={color}
    />
  );
};

export const MainTabNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();

  const insets = useSafeAreaInsets();

  // Calcular padding inferior basado en insets para evitar solapamientos con botones de Android/iOS
  const tabPaddingBottom = insets.bottom > 0 ? insets.bottom : Platform.OS === 'ios' ? 30 : 12;
  const tabHeight = (Platform.OS === 'ios' ? 64 : 60) + tabPaddingBottom;

  const screenOptions = {
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: isDark ? '#A0A0A0' : '#6B7280',
    tabBarStyle: {
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      height: tabHeight,
      paddingTop: 8,
      paddingBottom: tabPaddingBottom,
      elevation: 8,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: -2 },
      shadowRadius: 4,
    },
    tabBarHideOnKeyboard: true, // Evita solapamientos raros cuando el teclado está activo o transicionando
    tabBarShowLabel: false,
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
            <TabIcon name={TAB_CONFIG.Dashboard.icon} focused={focused} color={color} size={size} />
          ),
          tabBarLabel: TAB_CONFIG.Dashboard.label,
        }}
      />
      <Tab.Screen
        name="CheckIn"
        component={CheckInNavigator}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name={TAB_CONFIG.CheckIn.icon} focused={focused} color={color} size={size} />
          ),
          tabBarLabel: TAB_CONFIG.CheckIn.label,
        }}
      />
      <Tab.Screen
        name="Medications"
        component={MedicationScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name={TAB_CONFIG.Medications.icon}
              focused={focused}
              color={color}
              size={size}
            />
          ),
          tabBarLabel: TAB_CONFIG.Medications.label,
        }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesNavigator}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name={TAB_CONFIG.Notes.icon} focused={focused} color={color} size={size} />
          ),
          tabBarLabel: TAB_CONFIG.Notes.label,
        }}
      />
      <Tab.Screen
        name="Chatbot"
        component={ChatbotScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name={TAB_CONFIG.Chatbot.icon} focused={focused} color={color} size={size} />
          ),
          tabBarLabel: TAB_CONFIG.Chatbot.label,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name={TAB_CONFIG.Profile.icon} focused={focused} color={color} size={size} />
          ),
          tabBarLabel: TAB_CONFIG.Profile.label,
        }}
      />
    </Tab.Navigator>
  );
};

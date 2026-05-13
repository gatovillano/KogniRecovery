import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

const CheckInNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <CheckInStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <CheckInStack.Screen name="CheckInHome" component={CheckInScreen} />
      <CheckInStack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <CheckInStack.Screen
        name="SubstanceExpense"
        component={SubstanceExpenseScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <CheckInStack.Screen
        name="SubstanceDose"
        component={SubstanceDoseScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
    </CheckInStack.Navigator>
  );
};

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
    label: 'Chat',
  },
  Profile: {
    icon: 'person-outline',
    iconFilled: 'person',
    label: 'Perfil',
  },
} as const;

const TabIcon: React.FC<{
  name: string;
  focused: boolean;
  color: string;
  size: number;
}> = ({ name, focused, color, size }) => {
  return (
    <View style={focused ? undefined : undefined}>
      <Icon
        name={focused ? (name.replace('-outline', '') as any) : (name as any)}
        size={focused ? size + 2 : size}
        color={color}
      />
    </View>
  );
};

export const MainTabNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const tabPaddingBottom =
    Platform.OS === 'android'
      ? Math.max(insets.bottom, 12) + 6
      : insets.bottom > 0
        ? Math.max(insets.bottom, 10)
        : 24;
  const tabHeight = (Platform.OS === 'ios' ? 56 : 54) + tabPaddingBottom;
  const tabMarginBottom = 0;

  const screenOptions = {
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.textSecondary,
    tabBarStyle: {
      backgroundColor: theme.colors.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      height: tabHeight,
      marginBottom: tabMarginBottom,
      paddingTop: 8,
      paddingBottom: tabPaddingBottom,
      elevation: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: isDark ? 0.3 : 0.03,
      shadowRadius: 10,
    },
    tabBarHideOnKeyboard: true,
    tabBarShowLabel: true,
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: '400' as const,
      marginBottom: 0,
      letterSpacing: 0.1,
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

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '@theme/ThemeContext';
import { MainTabParamList, ProfileStackParamList, CheckInStackParamList } from './types';
import {
  DashboardScreen, CheckInScreen, ChatbotScreen, ProfileScreen,
  AISettingsScreen, IntelligenceProfileScreen, ClinicalDataConsentScreen,
  MedicationScreen, NotesScreen, NoteDetailScreen, ProgressScreen,
  SubstanceExpenseScreen, SubstanceDoseScreen,
} from '@screens';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const CheckInStack = createNativeStackNavigator<CheckInStackParamList>();

const ProfileNavigator: React.FC = () => {
  const { theme } = useTheme();
  return (
    <ProfileStack.Navigator screenOptions={{
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: theme.colors.text,
      headerTitleStyle: { fontWeight: '700' },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: theme.colors.background },
    }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'Más' }} />
      <ProfileStack.Screen name="NotesHome" component={NotesScreen} options={{ title: 'Mis notas' }} />
      <ProfileStack.Screen name="NoteDetail" component={NoteDetailScreen} options={{ title: 'Nota' }} />
      <ProfileStack.Screen name="AISettings" component={AISettingsScreen} options={{ title: 'Ajustes de LÚA' }} />
      <ProfileStack.Screen name="IntelligenceProfile" component={IntelligenceProfileScreen} options={{ title: 'Memoria de LÚA' }} />
      <ProfileStack.Screen name="ClinicalConsent" component={ClinicalDataConsentScreen} options={{ title: 'Consentimiento clínico' }} />
    </ProfileStack.Navigator>
  );
};

const CheckInNavigator: React.FC = () => {
  const { theme } = useTheme();
  return (
    <CheckInStack.Navigator screenOptions={{
      headerShown: false, animation: 'slide_from_right',
      contentStyle: { backgroundColor: theme.colors.background },
    }}>
      <CheckInStack.Screen name="CheckInHome" component={CheckInScreen} />
      <CheckInStack.Screen name="Progress" component={ProgressScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <CheckInStack.Screen name="SubstanceExpense" component={SubstanceExpenseScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <CheckInStack.Screen name="SubstanceDose" component={SubstanceDoseScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
    </CheckInStack.Navigator>
  );
};

const TAB_CONFIG = {
  Dashboard: { icon: 'home-outline', label: 'Inicio' },
  CheckIn: { icon: 'journal-outline', label: 'Bitácora' },
  Medications: { icon: 'medkit-outline', label: 'Salud' },
  Chatbot: { icon: 'sparkles-outline', label: 'LÚA' },
  Profile: { icon: 'grid-outline', label: 'Más' },
} as const;

export const MainTabNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 10) + 4 : Math.max(insets.bottom, 8);
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textSecondary,
      tabBarHideOnKeyboard: true,
      tabBarShowLabel: true,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
      tabBarStyle: {
        backgroundColor: theme.colors.card, borderTopColor: theme.colors.border,
        borderTopWidth: StyleSheet.hairlineWidth, height: 58 + bottomPadding,
        paddingTop: 7, paddingBottom: bottomPadding, elevation: 0,
        shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
        shadowOpacity: isDark ? 0.22 : 0.035, shadowRadius: 12,
      },
      sceneStyle: { backgroundColor: theme.colors.background },
    }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{
        tabBarLabel: TAB_CONFIG.Dashboard.label,
        tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'home' : TAB_CONFIG.Dashboard.icon} size={22} color={color} />,
      }} />
      <Tab.Screen name="CheckIn" component={CheckInNavigator} options={{
        tabBarLabel: TAB_CONFIG.CheckIn.label,
        tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'journal' : TAB_CONFIG.CheckIn.icon} size={22} color={color} />,
      }} />
      <Tab.Screen name="Medications" component={MedicationScreen} options={{
        tabBarLabel: TAB_CONFIG.Medications.label,
        tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'medkit' : TAB_CONFIG.Medications.icon} size={22} color={color} />,
      }} />
      <Tab.Screen name="Chatbot" component={ChatbotScreen} options={{
        tabBarLabel: TAB_CONFIG.Chatbot.label,
        tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'sparkles' : TAB_CONFIG.Chatbot.icon} size={22} color={color} />,
      }} />
      <Tab.Screen name="Profile" component={ProfileNavigator} options={{
        tabBarLabel: TAB_CONFIG.Profile.label,
        tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'grid' : TAB_CONFIG.Profile.icon} size={22} color={color} />,
      }} />
    </Tab.Navigator>
  );
};

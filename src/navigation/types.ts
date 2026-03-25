/**
 * Tipos TypeScript para React Navigation
 * Define los param lists para todos los navegadores
 */

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  CheckIn: undefined;
  Medications: undefined;
  Chatbot: undefined;
  Profile: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  DashboardDetails: { itemId: string };
};

export type CheckInStackParamList = {
  CheckInHome: undefined;
  CheckInHistory: undefined;
  Progress: undefined;
  SubstanceExpense: undefined;
};

export type ChatbotStackParamList = {
  ChatbotHome: undefined;
  ChatbotDetail: { conversationId?: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  ProfileSettings: undefined;
  ProfileEdit: undefined;
  EmergencyContacts: undefined;
  AISettings: undefined;
  IntelligenceProfile: undefined;
};

// ============================================
// Tipos de navegación (Props)
// ============================================

import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;
export type ProfileStackNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;
export type AuthStackNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
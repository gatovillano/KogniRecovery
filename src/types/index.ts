/**
 * Tipos TypeScript para KogniRecovery
 * Definiciones de tipos base utilizados en toda la aplicación
 */

import { ViewStyle, TextStyle, GestureResponderEvent, StyleProp } from 'react-native';

// ==================== TIPOS DE USUARIO ====================

export type UserRole = 'patient' | 'family' | 'professional' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  name?: string;
  profile?: UserProfile;
  createdAt: string;
  updatedAt: string;
  llm_provider?: 'openai' | 'anthropic' | 'azure' | 'local' | 'openrouter';
  llm_model?: string;
  llm_api_key?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  birthDate?: Date;
  recoveryStartDate?: Date;
  emergencyContact?: EmergencyContact;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

// ==================== TIPOS DE AUTENTICACIÓN ====================

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  role: UserRole;
}

// ==================== TIPOS DE UI ====================

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  overlay: string;
}

export interface ThemeTypography {
  fontFamily: {
    regular: string;
    medium: string;
    bold: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeShadows {
  sm: ViewStyle;
  md: ViewStyle;
  lg: ViewStyle;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  shadows: ThemeShadows;
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

// ==================== TIPOS DE CHECK-IN ====================

export type CheckInType = 'daily' | 'weekly' | 'monthly';

export interface CheckIn {
  id: string;
  userId: string;
  type: CheckInType;
  mood: number; // 1-5
  cravings: number; // 0-10
  triggers?: string[];
  notes?: string;
  completedAt: Date;
  createdAt: Date;
}

export interface CheckInFormData {
  mood: number;
  cravings: number;
  triggers: string[];
  notes: string;
}

// ==================== TIPOS DE NAVEGACIÓN ====================

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
  Chatbot: undefined;
  Profile: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  DashboardDetails: { itemId: string };
};

// ==================== TIPOS DE COMPONENTES UI ====================

export interface ButtonProps {
  title: string;
  onPress: (event?: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  fullScreen?: boolean;
  text?: string;
}

// ==================== TIPOS DE SERVICIOS ====================

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface LLMRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  text: string;
  tokensUsed: number;
  model: string;
}

// ==================== TIPOS DE NOTIFICACIONES ====================

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  data?: Record<string, any>;
  createdAt: Date;
}

// ==================== TIPOS DE EMERGENCIA ====================

export interface EmergencyAlert {
  id: string;
  userId: string;
  type: 'emergency' | 'relapse' | 'help';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  message?: string;
  contactsNotified: boolean;
  createdAt: Date;
}
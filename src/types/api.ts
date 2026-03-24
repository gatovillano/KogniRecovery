/**
 * Tipos de respuesta del API - KogniRecovery
 * Define las interfaces y tipos para las respuestas del backend
 */

// ============================================
// Tipos genéricos de respuesta
// ============================================

/**
 * Respuesta estándar del API
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * Respuesta paginada del API
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Error de respuesta del API
 */
export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

// ============================================
// Tipos de autenticación
// ============================================

/**
 * Payload para iniciar sesión
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Payload para registrar usuario
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

/**
 * Payload para refresh token
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Respuesta de autenticación
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

/**
 * Usuario del sistema
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * Roles de usuario
 */
export type UserRole = 'patient' | 'family' | 'admin' | 'professional';

/**
 * Tokens de autenticación
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// ============================================
// Tipos de check-in
// ============================================

/**
 * Estado de ánimo para check-in
 */
export type MoodState = 
  | 'great' 
  | 'good' 
  | 'okay' 
  | 'low' 
  | 'bad';

/**
 * Payload para crear check-in
 */
export interface CheckInRequest {
  mood: MoodState;
  notes?: string;
  symptoms?: string[];
  sleepHours?: number;
  medicationsTaken?: boolean;
}

/**
 * Check-in registrado
 */
export interface CheckIn {
  id: string;
  userId: string;
  mood: MoodState;
  notes?: string;
  symptoms?: string[];
  sleepHours?: number;
  medicationsTaken?: boolean;
  createdAt: string;
}

// ============================================
// Tipos de medicamentos
// ============================================

/**
 * Medicamento del usuario
 */
export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload para crear/actualizar medicamento
 */
export interface MedicationRequest {
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate?: string;
  notes?: string;
}

// ============================================
// Tipos de recursos
// ============================================

/**
 * Recurso de ayuda
 */
export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  url?: string;
  category: string;
  featured: boolean;
  createdAt: string;
}

/**
 * Tipos de recursos
 */
export type ResourceType = 
  | 'article' 
  | 'video' 
  | 'hotline' 
  | 'support_group' 
  | 'emergency';

// ============================================
// Tipos de chatbot
// ============================================

/**
 * Mensaje del chatbot
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * Solicitud al chatbot
 */
export interface ChatRequest {
  message: string;
  context?: {
    recentMood?: MoodState;
    lastCheckIn?: string;
    activeMedications?: string[];
  };
}

/**
 * Respuesta del chatbot
 */
export interface ChatResponse {
  message: string;
  suggestions?: string[];
  resources?: Resource[];
}

// ============================================
// Tipos de emergencia
// ============================================

/**
 * Contacto de emergencia
 */
export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  createdAt: string;
}

/**
 * Payload para contacto de emergencia
 */
export interface EmergencyContactRequest {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
}

// ============================================
// Tipos de configuración
// ============================================

/**
 * Configuración del usuario
 */
export interface UserSettings {
  notifications: {
    checkInReminders: boolean;
    medicationReminders: boolean;
    emergencyAlerts: boolean;
    familyUpdates: boolean;
  };
  privacy: {
    shareWithFamily: boolean;
    shareLocation: boolean;
    dataCollection: boolean;
  };
  emergency: {
    autoAlert: boolean;
    alertDelay: number;
  };
}

// ============================================
// Tipos de red/comunicación
// ============================================

/**
 * Estado de la red
 */
export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type?: 'wifi' | 'cellular' | 'none';
}

/**
 * Opciones de configuración del API
 */
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

/**
 * Opciones de request
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
}

// ============================================
// Tipos de respuesta específicos
// ============================================

/**
 * Respuesta de logout
 */
export interface LogoutResponse {
  message: string;
  success: boolean;
}

/**
 * Respuesta de verificación de token
 */
export interface TokenVerificationResponse {
  valid: boolean;
  user?: User;
  expiresAt?: number;
}

// ============================================
// Tipos de Dashboard
// ============================================

/**
 * Mensaje de la pared compartida
 */
export interface WallMessage {
  id: string;
  message: string;
  emoji: string | null;
  sender_name: string;
  created_at: string;
}

/**
 * Datos completos del dashboard del paciente
 */
export interface DashboardData {
  profile: any;
  today_checkin: any;
  streaks: any[];
  checkin_stats: any;
  active_cravings: any[];
  craving_stats: any;
  wall_messages: WallMessage[];
  unread_notifications_count: number;
}

/**
 * Endpoints del API - KogniRecovery
 * Constantes con las URLs del backend
 */

// URL base del API desde variables de entorno
// En Expo, las variables de entorno se acceden via process.env
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
console.log('🌐 [Config] API_URL cargada:', API_URL);
const API_VERSION = 'v1';

/**
 * Construye la URL completa del endpoint
 */
const buildUrl = (endpoint: string): string => {
  return `${API_URL}/api/${API_VERSION}${endpoint}`;
};

// ============================================
// Endpoints de autenticación
// ============================================

export const AUTH_ENDPOINTS = {
  /** Iniciar sesión */
  LOGIN: buildUrl('/auth/login'),

  /** Registrar nuevo usuario */
  REGISTER: buildUrl('/auth/register'),

  /** Actualizar refresh token */
  REFRESH: buildUrl('/auth/refresh'),

  /** Cerrar sesión */
  LOGOUT: buildUrl('/auth/logout'),

  /** Verificar token */
  VERIFY: buildUrl('/auth/verify'),

  /** Solicitar recuperación de contraseña */
  FORGOT_PASSWORD: buildUrl('/auth/forgot-password'),

  /** Restablecer contraseña */
  RESET_PASSWORD: buildUrl('/auth/reset-password'),

  /** Confirmar email */
  CONFIRM_EMAIL: buildUrl('/auth/confirm-email'),
} as const;

// ============================================
// Endpoints de usuario
// ============================================

export const USER_ENDPOINTS = {
  /** Obtener perfil del usuario */
  PROFILE: buildUrl('/users/me'),

  /** Actualizar perfil */
  UPDATE_PROFILE: buildUrl('/users/me'),

  /** Obtener configuración del usuario */
  SETTINGS: buildUrl('/users/me/settings'),

  /** Actualizar configuración */
  UPDATE_SETTINGS: buildUrl('/users/me/settings'),

  /** Cambiar contraseña */
  CHANGE_PASSWORD: buildUrl('/users/me/password'),

  /** Subir avatar */
  UPLOAD_AVATAR: buildUrl('/users/me/avatar'),

  /** Eliminar cuenta */
  DELETE_ACCOUNT: buildUrl('/users/me'),

  /** Actualizar configuración de IA */
  UPDATE_AI_SETTINGS: buildUrl('/profiles/me/ai-settings'),
} as const;

// ============================================
// Endpoints de check-in
// ============================================

export const CHECKIN_ENDPOINTS = {
  /** Lista de check-ins */
  LIST: buildUrl('/checkins'),

  /** Crear nuevo check-in */
  CREATE: buildUrl('/checkins'),

  /** Obtener check-in específico */
  GET: (id: string) => buildUrl(`/checkins/${id}`),

  /** Actualizar check-in */
  UPDATE: (id: string) => buildUrl(`/checkins/${id}`),

  /** Eliminar check-in */
  DELETE: (id: string) => buildUrl(`/checkins/${id}`),

  /** Obtener estadísticas de check-in */
  STATS: buildUrl('/checkins/stats'),

  /** Obtener racha de check-ins */
  STREAK: buildUrl('/checkins/streak'),
} as const;

// ============================================
// Endpoints de medicamentos
// ============================================

export const MEDICATION_ENDPOINTS = {
  /** Lista de medicamentos */
  LIST: buildUrl('/medications'),

  /** Crear medicamento */
  CREATE: buildUrl('/medications'),

  /** Actualizar medicamento */
  UPDATE: (id: string) => buildUrl(`/medications/${id}`),

  /** Eliminar medicamento */
  DELETE: (id: string) => buildUrl(`/medications/${id}`),

  /** Marcar/desmarcar como tomado */
  TOGGLE_TAKEN: (id: string) => buildUrl(`/medications/${id}/toggle-taken`),

  /** Estado diario de medicamentos */
  DAILY_STATUS: buildUrl('/medications/daily-status'),
} as const;

// ============================================
// Endpoints de recursos
// ============================================

export const RESOURCE_ENDPOINTS = {
  /** Lista de recursos */
  LIST: buildUrl('/resources'),

  /** Obtener recurso específico */
  GET: (id: string) => buildUrl(`/resources/${id}`),

  /** Recursos destacados */
  FEATURED: buildUrl('/resources/featured'),

  /** Buscar recursos */
  SEARCH: buildUrl('/resources/search'),

  /** Recursos por categoría */
  BY_CATEGORY: (category: string) => buildUrl(`/resources/category/${category}`),
} as const;

// ============================================
// Endpoints de chatbot
// ============================================

export const CHATBOT_ENDPOINTS = {
  /** Enviar mensaje */
  SEND_MESSAGE: buildUrl('/chatbot/message'),

  /** Obtener historial */
  HISTORY: buildUrl('/chatbot/history'),

  /** Limpiar conversación */
  CLEAR: buildUrl('/chatbot/clear'),

  /** Sugerencias */
  SUGGESTIONS: buildUrl('/chatbot/suggestions'),
} as const;

// ============================================
// Endpoints de contactos de emergencia
// ============================================

export const EMERGENCY_CONTACT_ENDPOINTS = {
  /** Lista de contactos */
  LIST: buildUrl('/emergency-contacts'),

  /** Crear contacto */
  CREATE: buildUrl('/emergency-contacts'),

  /** Obtener contacto específico */
  GET: (id: string) => buildUrl(`/emergency-contacts/${id}`),

  /** Actualizar contacto */
  UPDATE: (id: string) => buildUrl(`/emergency-contacts/${id}`),

  /** Eliminar contacto */
  DELETE: (id: string) => buildUrl(`/emergency-contacts/${id}`),

  /** Contacto primario */
  PRIMARY: buildUrl('/emergency-contacts/primary'),
} as const;

// ============================================
// Endpoints de familiar/compartir
// ============================================

export const FAMILY_ENDPOINTS = {
  /** Miembros de la familia */
  MEMBERS: buildUrl('/family/members'),

  /** Invitar familiar */
  INVITE: buildUrl('/family/invite'),

  /** Aceptar invitación */
  ACCEPT_INVITATION: (token: string) => buildUrl(`/family/invite/${token}/accept`),

  /** Rechazar invitación */
  DECLINE_INVITATION: (token: string) => buildUrl(`/family/invite/${token}/decline`),

  /** Eliminar miembro */
  REMOVE_MEMBER: (id: string) => buildUrl(`/family/members/${id}`),

  /** Obtener datos compartidos */
  SHARED_DATA: buildUrl('/family/shared-data'),
} as const;

// ============================================
// Endpoints de notificaciones
// ============================================

export const NOTIFICATION_ENDPOINTS = {
  /** Lista de notificaciones */
  LIST: buildUrl('/notifications'),

  /** Marcar como leída */
  MARK_READ: (id: string) => buildUrl(`/notifications/${id}/read`),

  /** Marcar todas como leídas */
  MARK_ALL_READ: buildUrl('/notifications/read-all'),

  /** Eliminar notificación */
  DELETE: (id: string) => buildUrl(`/notifications/${id}`),

  /** Configuración de notificaciones */
  SETTINGS: buildUrl('/notifications/settings'),

  /** Actualizar configuración */
  UPDATE_SETTINGS: buildUrl('/notifications/settings'),
} as const;

// ============================================
// Endpoints de dashboard
// ============================================

export const DASHBOARD_ENDPOINTS = {
  /** Estadísticas generales */
  STATS: buildUrl('/dashboard/stats'),

  /** Resumen diario */
  DAILY_SUMMARY: buildUrl('/dashboard/daily-summary'),

  /** Tendencias */
  TRENDS: buildUrl('/dashboard/trends'),

  /** Próximos recordatorios */
  UPCOMING_REMINDERS: buildUrl('/dashboard/upcoming-reminders'),

  /** Actividad reciente */
  RECENT_ACTIVITY: buildUrl('/dashboard/recent-activity'),
} as const;

// ============================================
// URLs públicas (sin autenticación)
// ============================================

export const PUBLIC_ENDPOINTS = {
  /** Información de la app */
  APP_INFO: buildUrl('/app/info'),

  /** Términos y condiciones */
  TERMS: buildUrl('/app/terms'),

  /** Política de privacidad */
  PRIVACY: buildUrl('/app/privacy'),

  /** Líneas de emergencia por país */
  CRISIS_LINES: buildUrl('/app/crisis-lines'),
} as const;

// ============================================
// Exportar configuración base
// ============================================

export const API_CONFIG = {
  BASE_URL: API_URL,
  VERSION: API_VERSION,
  TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000', 10),
} as const;

// ============================================
// Endpoints de Bitácora (Journal)
// ============================================
export const JOURNAL_ENDPOINTS = {
  // Notas libres
  NOTES: buildUrl('/journal/notes'),
  NOTE: (id: string) => buildUrl(`/journal/notes/${id}`),

  // Hábitos
  HABITS: buildUrl('/journal/habits'),
  HABIT: (id: string) => buildUrl(`/journal/habits/${id}`),

  // Entorno social
  SOCIAL: buildUrl('/journal/social'),
  SOCIAL_ENTRY: (id: string) => buildUrl(`/journal/social/${id}`),

  // Actividades (antes/durante/después)
  ACTIVITIES: buildUrl('/journal/activities'),
  ACTIVITY: (id: string) => buildUrl(`/journal/activities/${id}`),

  // Análisis de consumo/impulso
  ANALYSIS: buildUrl('/journal/analysis'),
  ANALYSIS_ENTRY: (id: string) => buildUrl(`/journal/analysis/${id}`),

  // Feed unificado de todos los registros
  FEED: buildUrl('/journal/feed'),

  // Gestión de hábitos (Nuevos)
  HABITS_LIST: buildUrl('/journal/habits/list'),
  HABITS_STATUS: buildUrl('/journal/habits/status'),
  HABIT_TOGGLE: buildUrl('/journal/habits/toggle'),
  HABIT_DEFINITION: buildUrl('/journal/habits/definition'),
  HABIT_DEFINITION_ID: (id: string) => buildUrl(`/journal/habits/definition/${id}`),
  HABITS_STATS: buildUrl('/journal/habits/stats'),
} as const;

// ============================================
// Endpoints de gastos en sustancias
// ============================================
export const SUBSTANCE_EXPENSE_ENDPOINTS = {
  /** Lista de gastos */
  LIST: buildUrl('/substance-expenses'),

  /** Registrar nuevo gasto */
  CREATE: buildUrl('/substance-expenses'),

  /** Resumen de gastos */
  SUMMARY: buildUrl('/substance-expenses/summary'),

  /** Actualizar gasto */
  UPDATE: (id: string) => buildUrl(`/substance-expenses/${id}`),

  /** Eliminar gasto */
  DELETE: (id: string) => buildUrl(`/substance-expenses/${id}`),
} as const;

export default {
  AUTH_ENDPOINTS,
  USER_ENDPOINTS,
  CHECKIN_ENDPOINTS,
  MEDICATION_ENDPOINTS,
  RESOURCE_ENDPOINTS,
  CHATBOT_ENDPOINTS,
  EMERGENCY_CONTACT_ENDPOINTS,
  FAMILY_ENDPOINTS,
  NOTIFICATION_ENDPOINTS,
  DASHBOARD_ENDPOINTS,
  PUBLIC_ENDPOINTS,
  API_CONFIG,
  JOURNAL_ENDPOINTS,
  SUBSTANCE_EXPENSE_ENDPOINTS,
};

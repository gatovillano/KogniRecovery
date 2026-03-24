/**
 * Constantes de la aplicación KogniRecovery
 * Centraliza valores que se usan en múltiples lugares
 */

export const APP_CONFIG = {
  name: 'KogniRecovery',
  version: '1.0.0',
  environment: process.env.APP_ENV || 'development',
};

export const CHECKIN_CONFIG = {
  types: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
  } as const,
  mood: {
    MIN: 1,
    MAX: 5,
    labels: {
      1: 'Muy mal',
      2: 'Mal',
      3: 'Regular',
      4: 'Bien',
      5: 'Excelente',
    },
  },
  cravings: {
    MIN: 0,
    MAX: 10,
    labels: {
      0: 'Ninguno',
      1: 'Muy leve',
      3: 'Leve',
      5: 'Moderado',
      7: 'Fuerte',
      10: 'Intenso',
    },
  },
  triggers: [
    'Estrés',
    'Ansiedad',
    'Aburrimiento',
    'Presión social',
    'Lugares específicos',
    'Personas específicas',
    'Emociones negativas',
    'Celebraciones',
    'Dolor físico',
    'Insomnio',
    'Otro',
  ] as const,
};

export const USER_CONFIG = {
  roles: {
    PATIENT: 'patient',
    FAMILY: 'family',
    PROFESSIONAL: 'professional',
    ADMIN: 'admin',
  } as const,
  defaultRole: 'patient',
};

export const THEME_CONFIG = {
  modes: {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto',
  } as const,
  defaultMode: 'light',
  storageKey: 'kognirecovery_theme_mode',
};

export const STORAGE_KEYS = {
  AUTH: 'kognirecovery-auth-storage',
  UI: 'kognirecovery-ui-storage',
  CHECKIN: 'kognirecovery-checkin-storage',
  THEME: 'kognirecovery_theme_mode',
};

export const API_CONFIG = {
  defaultTimeout: 30000,
  retries: 3,
  retryDelay: 1000,
};

export const NAVIGATION_CONFIG = {
  initialRoute: 'Auth',
  authStack: {
    login: 'Login',
    register: 'Register',
    forgotPassword: 'ForgotPassword',
  },
  mainTabs: {
    dashboard: 'Dashboard',
    checkin: 'CheckIn',
    chatbot: 'Chatbot',
    profile: 'Profile',
  },
};

export const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    minLength: 5,
    maxLength: 254,
  },
  password: {
    minLength: 8,
    maxLength: 128,
    requiresUppercase: true,
    requiresLowercase: true,
    requiresNumber: true,
  },
  phone: {
    pattern: /^\+?[1-9]\d{1,14}$/,
  },
};

export const DATE_FORMATS = {
  display: 'DD/MM/YYYY',
  api: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  short: 'DD/MM',
  long: 'dddd, D [de] MMMM [de] YYYY',
};

export const ERROR_MESSAGES = {
  generic: 'Ha ocurrido un error. Por favor, intenta de nuevo.',
  network: 'Error de conexión. Verifica tu internet.',
  validation: 'Datos inválidos. Por favor, revisa la información.',
  auth: {
    invalidCredentials: 'Correo o contraseña incorrectos.',
    userNotFound: 'Usuario no encontrado.',
    emailInUse: 'El correo ya está registrado.',
  },
};
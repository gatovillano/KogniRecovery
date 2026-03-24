/**
 * Hooks de KogniRecovery
 * Exportaciones centralizadas de todos los hooks personalizados
 */

// Exportaciones del hook useAuth
export { useAuth, default as default } from './useAuth';

// Exportaciones del hook useFormValidation
export { useFormValidation } from './useFormValidation';
export type {
  FormValues,
  FormErrors,
  FormTouched,
  FormValidationState,
  UseFormValidationOptions,
  UseFormValidationReturn,
} from './useFormValidation';

// Exportaciones del hook useProfile
export { useProfile } from './useProfile';
export type {
  Profile,
  ProfileSettings,
  SubstancePreference,
} from './useProfile';

// Exportaciones del hook useCheckIn
export { useCheckIn } from './useCheckIn';
export type {
  CheckIn,
  CheckInStats,
  Streak,
  MoodHistory,
} from './useCheckIn';

// Exportaciones del hook useChatbot
export { useChatbot } from './useChatbot';
export type {
  Message,
  Conversation,
  Scenario,
  QuickResponse,
} from './useChatbot';

// Exportaciones de tipos
export type {
  AuthStatus,
  LoginOptions,
  RegisterOptions,
  AuthOptions,
  ValidationResult,
  AuthOperationResult,
  TokenVerificationResult,
} from './types';

// Exportaciones de funciones utilitarias
export {
  validateEmail,
  validatePassword,
  validateLoginCredentials,
  validateRegisterData,
  AUTH_STORAGE_KEYS,
} from './types';

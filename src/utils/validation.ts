/**
 * Validadores reutilizables para formularios - KogniRecovery
 * Sistema de validación de formularios con mensajes en español
 * 
 * Validadores incluidos:
 * - email: Valida formato de email
 * - password: Valida contraseña (mínimo 8 caracteres, mayúscula, número)
 * - required: Campo requerido
 * - minLength / maxLength: Longitud mínima/máxima
 * - phone: Teléfono válido
 * - date: Fecha válida
 * - country: País válido de la lista
 * - equals: Dos campos iguales
 */

import { ValidationResult } from '../hooks/types';

// ============================================
// Tipos para validadores
// ============================================

/**
 * Tipo para función validadora
 */
export type ValidatorFunction = (
  value: string | undefined,
  allValues?: Record<string, string>
) => ValidationResult;

/**
 * Opciones para validadores que aceptan parámetros
 */
export interface ValidatorOptions {
  /** Mensaje de error personalizado */
  message?: string;
  /** Valor para comparación (para validadores como equals, minLength, etc.) */
  value?: string | number;
  /** Lista de valores válidos (para country, etc.) */
  options?: string[];
}

// ============================================
// Mensajes de error predeterminados (en español)
// ============================================

export const DEFAULT_MESSAGES = {
  required: 'Este campo es requerido',
  email: 'Ingresa un correo electrónico válido',
  emailFormat: 'El formato del correo es inválido',
  password: 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número',
  passwordMinLength: 'La contraseña debe tener al menos {min} caracteres',
  passwordNeedsUppercase: 'La contraseña debe contener al menos una letra mayúscula',
  passwordNeedsNumber: 'La contraseña debe contener al menos un número',
  minLength: 'El campo debe tener al menos {min} caracteres',
  maxLength: 'El campo no puede tener más de {max} caracteres',
  phone: 'Ingresa un número de teléfono válido',
  phoneFormat: 'El formato del teléfono es inválido',
  date: 'Ingresa una fecha válida',
  dateInvalid: 'La fecha ingresada no es válida',
  dateFuture: 'La fecha no puede ser futura',
  datePast: 'La fecha no puede ser pasada',
  country: 'Selecciona un país válido',
  equals: 'Los campos no coinciden',
  equalsField: 'El campo {field} no coincide',
  invalidValue: 'El valor ingresdo no es válido',
  url: 'Ingresa una URL válida',
  number: 'Ingresa un número válido',
  positiveNumber: 'Ingresa un número positivo',
  integer: 'Ingresa un número entero',
  range: 'El valor debe estar entre {min} y {max}',
  pattern: 'El formato del campo es inválido',
} as const;

// ============================================
// Lista de países válidos
// ============================================

export const COUNTRIES = [
  'Argentina',
  'Bolivia',
  'Brasil',
  'Canadá',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Cuba',
  'Ecuador',
  'El Salvador',
  'España',
  'Estados Unidos',
  'Guatemala',
  'Haití',
  'Honduras',
  'México',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'Puerto Rico',
  'República Dominicana',
  'Uruguay',
  'Venezuela',
  'Otro',
] as const;

export type Country = (typeof COUNTRIES)[number];

// ============================================
// Validadores
// ============================================

/**
 * Validador de campo requerido
 */
export const required = (message?: string): ValidatorFunction => {
  return (value: string | undefined): ValidationResult => {
    if (value === undefined || value === null || value.trim() === '') {
      return {
        isValid: false,
        error: message || DEFAULT_MESSAGES.required,
      };
    }
    return { isValid: true };
  };
};

/**
 * Validador de email
 */
export const email = (message?: string): ValidatorFunction => {
  return (value: string | undefined): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: true }; // No es requerido, usar required() si se necesita
    }

    // Regex más completo para validación de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(value)) {
      return {
        isValid: false,
        error: message || DEFAULT_MESSAGES.email,
      };
    }
    return { isValid: true };
  };
};

/**
 * Validador de contraseña segura
 * Requiere: mínimo 8 caracteres, al menos una mayúscula y un número
 */
export const password = (message?: string): ValidatorFunction => {
  return (value: string | undefined): ValidationResult => {
    if (!value || value === '') {
      return { isValid: true }; // No es requerido, usar required() si se necesita
    }

    const errors: string[] = [];

    // Verificar longitud mínima
    if (value.length < 8) {
      errors.push(DEFAULT_MESSAGES.passwordMinLength.replace('{min}', '8'));
    }

    // Verificar mayúscula
    if (!/[A-Z]/.test(value)) {
      errors.push(DEFAULT_MESSAGES.passwordNeedsUppercase);
    }

    // Verificar número
    if (!/[0-9]/.test(value)) {
      errors.push(DEFAULT_MESSAGES.passwordNeedsNumber);
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        error: message || errors.join('. '),
      };
    }

    return { isValid: true };
  };
};

/**
 * Validador de longitud mínima
 */
export const minLength = (min: number, message?: string): ValidatorFunction => {
  return (value: string | undefined): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: true }; // No es requerido
    }

    if (value.length < min) {
      return {
        isValid: false,
        error: message || DEFAULT_MESSAGES.minLength.replace('{min}', String(min)),
      };
    }
    return { isValid: true };
  };
};

/**
 * Validador de longitud máxima
 */
export const maxLength = (max: number, message?: string): ValidatorFunction => {
  return (value: string | undefined): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: true }; // No es requerido
    }

    if (value.length > max) {
      return {
        isValid: false,
        error: message || DEFAULT_MESSAGES.maxLength.replace('{max}', String(max)),
      };
    }
    return { isValid: true };
  };
};

/**
 * Validador de teléfono
 * Acepta formatos: +54 9 11 1234-5678, +1 555-555-5555, etc.
 */
export const phone = (message?: string): ValidatorFunction => {
  return (value: string | undefined): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: true }; // No es requerido
    }

    // Eliminar espacios y guiones para validar
    const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
    
    // Regex para teléfonos internacionales (con o sin +)
    // Acepta: +5491112345678, 5491112345678, 1112345678, etc.
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    
    if (!phoneRegex.test(cleanPhone)) {
      return {
        isValid: false,
        error: message || DEFAULT_MESSAGES.phone,
      };
    }
    return { isValid: true };
  };
};

/**
 * Validador de fecha
 */
export const date = (
  message?: string,
  options?: {
    allowFuture?: boolean;
    allowPast?: boolean;
    minDate?: Date;
    maxDate?: Date;
  }
): ValidatorFunction => {
  const { allowFuture = true, allowPast = true, minDate, maxDate } = options || {};

  return (value: string | undefined): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: true }; // No es requerido
    }

    // Intentar parsear la fecha
    const dateObj = new Date(value);
    
    if (isNaN(dateObj.getTime())) {
      return {
        isValid: false,
        error: message || DEFAULT_MESSAGES.dateInvalid,
      };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Verificar fecha futura
    if (!allowFuture && dateObj > now) {
      return {
        isValid: false,
        error: message || DEFAULT_MESSAGES.dateFuture,
      };
    }

    // Verificar fecha pasada
    if (!allowPast && dateObj < now) {
      return {
        isValid: false,
        error: message || DEFAULT_MESSAGES.datePast,
      };
    }

    // Verificar fecha mínima
    if (minDate && dateObj < minDate) {
      return {
        isValid: false,
        error: message || `La fecha debe ser posterior al ${minDate.toLocaleDateString('es-CL')}`,
      };
    }

    // Verificar fecha máxima
    if (maxDate && dateObj > maxDate) {
      return {
        isValid: false,
        error: message || `La fecha debe ser anterior al ${maxDate.toLocaleDateString('es-CL')}`,
      };
    }

    return { isValid: true };
  };
};

/**
 * Validador de país
 */
export const country = (message?: string): ValidatorFunction => {
  return (value: string | undefined): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: true }; // No es requerido
    }

    const isValidCountry = COUNTRIES.some(
      (c) => c.toLowerCase() === value.toLowerCase()
    );

    if (!isValidCountry) {
      return {
        isValid: false,
        error: message || DEFAULT_MESSAGES.country,
      };
    }
    return { isValid: true };
  };
};

/**
 * Validador de comparación de campos
 * Compara dos campos para verificar que coincidan
 */
export const equals = (
  fieldName: string,
  compareField: string,
  message?: string
): ValidatorFunction => {
  return (value: string | undefined, allValues?: Record<string, string>): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: true }; // No es requerido
    }

    if (!allValues || allValues[compareField] === undefined) {
      return { isValid: true }; // El campo a comparar no existe aún
    }

    if (value !== allValues[compareField]) {
      return {
        isValid: false,
        error: message || DEFAULT_MESSAGES.equalsField.replace('{field}', fieldName),
      };
    }
    return { isValid: true };
  };
};

/**
 * Validador de URL
 */
export const url = (message?: string): ValidatorFunction => {
  return (value: string | undefined): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: true }; // No es requerido
    }

    try {
      new URL(value);
      return { isValid: true };
    } catch {
      return {
        isValid: false,
        error: message || DEFAULT_MESSAGES.url,
      };
    }
  };
};

/**
 * Validador de número
 */
export const number = (message?: string): ValidatorFunction => {
  return (value: string | undefined): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: true }; // No es requerido
    }

    if (isNaN(Number(value))) {
      return {
        isValid: false,
        error: message || DEFAULT_MESSAGES.number,
      };
    }
    return { isValid: true };
  };
};

/**
 * Validador de número positivo
 */
export const positiveNumber = (message?: string): ValidatorFunction => {
  return (value: string | undefined): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: true }; // No es requerido
    }

    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      return {
        isValid: false,
        error: message || DEFAULT_MESSAGES.positiveNumber,
      };
    }
    return { isValid: true };
  };
};

/**
 * Validador de número entero
 */
export const integer = (message?: string): ValidatorFunction => {
  return (value: string | undefined): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: true }; // No es requerido
    }

    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num)) {
      return {
        isValid: false,
        error: message || DEFAULT_MESSAGES.integer,
      };
    }
    return { isValid: true };
  };
};

/**
 * Validador de rango numérico
 */
export const range = (
  min: number,
  max: number,
  message?: string
): ValidatorFunction => {
  return (value: string | undefined): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: true }; // No es requerido
    }

    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
      return {
        isValid: false,
        error: message || DEFAULT_MESSAGES.range.replace('{min}', String(min)).replace('{max}', String(max)),
      };
    }
    return { isValid: true };
  };
};

/**
 * Validador de patrón (regex personalizado)
 */
export const pattern = (
  regex: RegExp,
  message?: string
): ValidatorFunction => {
  return (value: string | undefined): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: true }; // No es requerido
    }

    if (!regex.test(value)) {
      return {
        isValid: false,
        error: message || DEFAULT_MESSAGES.pattern,
      };
    }
    return { isValid: true };
  };
};

// ============================================
// Validadores compuestos
// ============================================

/**
 * Crea un validador que combina múltiples validadores en AND
 */
export const composeValidators = (...validators: ValidatorFunction[]): ValidatorFunction => {
  return (value: string | undefined, allValues?: Record<string, string>): ValidationResult => {
    for (const validator of validators) {
      const result = validator(value, allValues);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  };
};

/**
 * Crea un validador opcional (válido si está vacío o pasa la validación)
 */
export const optional = (validator: ValidatorFunction): ValidatorFunction => {
  return (value: string | undefined, allValues?: Record<string, string>): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: true };
    }
    return validator(value, allValues);
  };
};

// ============================================
// Función de validación de formulario completo
// ============================================

/**
 * Campo de validación con sus validadores
 */
export interface ValidationField {
  /** Nombre del campo */
  name: string;
  /** Validadores a aplicar */
  validators: ValidatorFunction[];
}

/**
 * Schema de validación de formulario
 */
export interface ValidationSchema {
  /** Nombre del formulario */
  name: string;
  /** Campos a validar */
  fields: ValidationField[];
}

/**
 * Valida un formulario completo
 */
export const validateForm = (
  values: Record<string, string>,
  schema: ValidationSchema
): Record<string, string> => {
  const errors: Record<string, string> = {};

  for (const field of schema.fields) {
    const value = values[field.name];
    
    for (const validator of field.validators) {
      const result = validator(value, values);
      if (!result.isValid && result.error) {
        errors[field.name] = result.error;
        break; // Solo un error por campo
      }
    }
  }

  return errors;
};

/**
 * Verifica si un formulario tiene errores
 */
export const hasErrors = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length > 0;
};

// ============================================
// Exportaciones
// ============================================

export default {
  required,
  email,
  password,
  minLength,
  maxLength,
  phone,
  date,
  country,
  equals,
  url,
  number,
  positiveNumber,
  integer,
  range,
  pattern,
  composeValidators,
  optional,
  validateForm,
  hasErrors,
  DEFAULT_MESSAGES,
  COUNTRIES,
};

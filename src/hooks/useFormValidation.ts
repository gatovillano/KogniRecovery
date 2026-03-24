/**
 * Hook useFormValidation - KogniRecovery
 * Hook personalizado para validación de formularios
 * 
 * Funcionalidades:
 * - Estado de errores por campo
 * - Validación en tiempo real (onChange)
 * - Validación al submit
 * - Reset de errores
 * - Mensajes de error personalizables
 */

import { useState, useCallback, useMemo, useEffect, ChangeEvent, FocusEvent } from 'react';
import { ValidatorFunction, ValidationField, ValidationSchema } from '../utils/validation';

// ============================================
// Tipos
// ============================================

/**
 * Valores del formulario
 */
export interface FormValues {
  [key: string]: string;
}

/**
 * Errores del formulario
 */
export interface FormErrors {
  [key: string]: string | undefined;
}

/**
 * Estado de touched (tocado) por campo
 */
export interface FormTouched {
  [key: string]: boolean;
}

/**
 * Estado de validación del formulario
 */
export interface FormValidationState {
  values: FormValues;
  errors: FormErrors;
  touched: FormTouched;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

/**
 * Opciones de configuración del hook
 */
export interface UseFormValidationOptions {
  /** Schema de validación del formulario */
  schema?: ValidationSchema;
  /** Valores iniciales del formulario */
  initialValues?: FormValues;
  /** Validar en tiempo real al cambiar (onChange) */
  validateOnChange?: boolean;
  /** Validar al perder el foco (onBlur) */
  validateOnBlur?: boolean;
  /** Validar al montar el formulario */
  validateOnMount?: boolean;
  /** Callback al validar exitosamente */
  onSuccess?: (values: FormValues) => void | Promise<void>;
  /** Callback al validar con errores */
  onError?: (errors: FormErrors, values: FormValues) => void;
  /** Mensajes de error personalizados (sobreescriben los del schema) */
  customMessages?: Record<string, string>;
}

/**
 * Métodos del hook devueltos al usuario
 */
export interface UseFormValidationReturn {
  // Estado
  values: FormValues;
  errors: FormErrors;
  touched: FormTouched;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  
  // Métodos
  handleChange: (fieldName: string) => (value: string) => void;
  handleChangeText: (fieldName: string) => (text: string) => void;
  handleBlur: (fieldName: string) => () => void;
  handleSubmit: () => Promise<boolean>;
  setFieldValue: (fieldName: string, value: string) => void;
  setFieldError: (fieldName: string, error: string | undefined) => void;
  resetForm: (newValues?: FormValues) => void;
  clearErrors: () => void;
  validateField: (fieldName: string) => boolean;
  validateForm: () => boolean;
  getFieldProps: (fieldName: string, validators?: ValidatorFunction[]) => {
    value: string;
    error: string | undefined;
    onChangeText: (text: string) => void;
    onBlur: () => void;
  };
}

// ============================================
// Hook principal
// ============================================

/**
 * Hook para validación de formularios
 * @param options Opciones de configuración
 * @returns Métodos y estado del formulario
 */
export const useFormValidation = (
  options: UseFormValidationOptions = {}
): UseFormValidationReturn => {
  const {
    schema,
    initialValues = {},
    validateOnChange = true,
    validateOnBlur = true,
    validateOnMount = false,
    onSuccess,
    onError,
    customMessages = {},
  } = options;

  // ============================================
  // Estado
  // ============================================

  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());

  // ============================================
  // Validación de campo individual
  // ============================================

  /**
   * Valida un campo específico
   */
  const validateSingleField = useCallback(
    (fieldName: string, value: string, allValues: FormValues): string | undefined => {
      // Buscar validadores en el schema
      const schemaField = schema?.fields.find((f) => f.name === fieldName);
      const validators = schemaField?.validators || [];

      // Si no hay validadores, el campo es válido
      if (validators.length === 0) {
        return undefined;
      }

      // Aplicar cada validador
      for (const validator of validators) {
        const result = validator(value, allValues);
        if (!result.isValid) {
          // Usar mensaje personalizado si existe
          return customMessages[fieldName] || result.error;
        }
      }

      return undefined;
    },
    [schema, customMessages]
  );

  /**
   * Valida todos los campos del formulario
   */
  const validateAllFields = useCallback(
    (formValues: FormValues): FormErrors => {
      const newErrors: FormErrors = {};

      if (!schema) {
        return newErrors;
      }

      for (const field of schema.fields) {
        const value = formValues[field.name];
        const error = validateSingleField(field.name, value || '', formValues);
        if (error) {
          newErrors[field.name] = error;
        }
      }

      return newErrors;
    },
    [schema, validateSingleField]
  );

  // ============================================
  // Validación al montar
  // ============================================

  useEffect(() => {
    if (validateOnMount && schema) {
      const initialErrors = validateAllFields(initialValues);
      setErrors(initialErrors);
    }
  }, []);

  // ============================================
  // Handlers
  // ============================================

  /**
   * Maneja el cambio de valor de un campo
   */
  const handleChange = useCallback(
    (fieldName: string) => (value: string) => {
      // Actualizar valor
      setValues((prev) => {
        const newValues = { ...prev, [fieldName]: value };
        
        // Marcar como dirty
        setDirtyFields((prev) => new Set(prev).add(fieldName));

        // Validar en tiempo real si está habilitado
        if (validateOnChange) {
          const error = validateSingleField(fieldName, value, newValues);
          setErrors((prevErrors) => ({
            ...prevErrors,
            [fieldName]: error,
          }));
        }

        return newValues;
      });
    },
    [validateOnChange, validateSingleField]
  );

  /**
   * Alias para handleChange compatible con TextInput
   */
  const handleChangeText = useCallback(
    (fieldName: string) => (text: string) => {
      handleChange(fieldName)(text);
    },
    [handleChange]
  );

  /**
   * Maneja el blur (pérdida de foco) de un campo
   */
  const handleBlur = useCallback(
    (fieldName: string) => () => {
      // Marcar campo como touched
      setTouched((prev) => ({ ...prev, [fieldName]: true }));

      // Validar al perder foco si está habilitado
      if (validateOnBlur) {
        const value = values[fieldName];
        const error = validateSingleField(fieldName, value || '', values);
        setErrors((prevErrors) => ({
          ...prevErrors,
          [fieldName]: error,
        }));
      }
    },
    [validateOnBlur, validateSingleField, values]
  );

  /**
   * Maneja el submit del formulario
   */
  const handleSubmit = useCallback(async (): Promise<boolean> => {
    setIsSubmitting(true);

    try {
      // Validar todos los campos
      const allErrors = validateAllFields(values);
      setErrors(allErrors);

      // Marcar todos los campos como touched
      const allTouched: FormTouched = {};
      Object.keys(values).forEach((key) => {
        allTouched[key] = true;
      });
      setTouched(allTouched);

      // Verificar si hay errores
      const hasErrors = Object.keys(allErrors).length > 0;

      if (!hasErrors) {
        // Validación exitosa
        await onSuccess?.(values);
        return true;
      } else {
        // Validación con errores
        onError?.(allErrors, values);
        return false;
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateAllFields, onSuccess, onError]);

  /**
   * Establece el valor de un campo
   */
  const setFieldValue = useCallback((fieldName: string, value: string) => {
    setValues((prev) => {
      const newValues = { ...prev, [fieldName]: value };
      setDirtyFields((prev) => new Set(prev).add(fieldName));
      return newValues;
    });
  }, []);

  /**
   * Establece el error de un campo manualmente
   */
  const setFieldError = useCallback((fieldName: string, error: string | undefined) => {
    setErrors((prev) => ({ ...prev, [fieldName]: error }));
  }, []);

  /**
   * Resetea el formulario
   */
  const resetForm = useCallback(
    (newValues?: FormValues) => {
      setValues(newValues || initialValues);
      setErrors({});
      setTouched({});
      setDirtyFields(new Set());
    },
    [initialValues]
  );

  /**
   * Limpia todos los errores
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Valida un campo específico y retorna si es válido
   */
  const validateField = useCallback(
    (fieldName: string): boolean => {
      const value = values[fieldName];
      const error = validateSingleField(fieldName, value || '', values);
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
      return !error;
    },
    [values, validateSingleField]
  );

  /**
   * Valida todo el formulario y retorna si es válido
   */
  const validateForm = useCallback((): boolean => {
    const allErrors = validateAllFields(values);
    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  }, [values, validateAllFields]);

  /**
   * Obtiene las props para un campo (compatible con componentes controlados)
   */
  const getFieldProps = useCallback(
    (fieldName: string, validators?: ValidatorFunction[]) => {
      // Si hay validadores personalizados, usarlos; si no, usar los del schema
      const effectiveValidators = validators || 
        schema?.fields.find((f) => f.name === fieldName)?.validators || [];

      const validateField = (value: string): string | undefined => {
        for (const validator of effectiveValidators) {
          const result = validator(value, values);
          if (!result.isValid) {
            return customMessages[fieldName] || result.error;
          }
        }
        return undefined;
      };

      return {
        value: values[fieldName] || '',
        error: errors[fieldName],
        onChangeText: handleChangeText(fieldName),
        onBlur: handleBlur(fieldName),
      };
    },
    [values, errors, schema, customMessages, handleChangeText, handleBlur]
  );

  // ============================================
  // Estado derivado
  // ============================================

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  const isDirty = useMemo(() => {
    return dirtyFields.size > 0;
  }, [dirtyFields]);

  // ============================================
  // Retorno
  // ============================================

  return {
    // Estado
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    isDirty,

    // Métodos
    handleChange,
    handleChangeText,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    clearErrors,
    validateField,
    validateForm,
    getFieldProps,
  };
};

// ============================================
// Exportaciones
// ============================================

export default useFormValidation;

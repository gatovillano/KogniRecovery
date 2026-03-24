/**
 * Schema de validación de Login - KogniRecovery
 * Valida los campos del formulario de inicio de sesión
 */

import { ValidationSchema } from '../validation';
import { required, email, minLength } from '../validation';

/**
 * Schema de validación para el formulario de login
 */
export const loginSchema: ValidationSchema = {
  name: 'login',
  fields: [
    {
      name: 'email',
      validators: [
        required('El correo electrónico es requerido'),
        email('Ingresa un correo electrónico válido'),
      ],
    },
    {
      name: 'password',
      validators: [
        required('La contraseña es requerida'),
        minLength(6, 'La contraseña debe tener al menos 6 caracteres'),
      ],
    },
  ],
};

/**
 * Valores iniciales del formulario de login
 */
export const loginInitialValues = {
  email: '',
  password: '',
};

/**
 * Mensajes de error personalizados para login
 */
export const loginCustomMessages = {
  email: undefined,
  password: undefined,
};

export default loginSchema;

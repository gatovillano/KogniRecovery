/**
 * Schema de validación de Registro - KogniRecovery
 * Valida los campos del formulario de registro de usuario
 */

import { ValidationSchema } from '../validation';
import { required, email, password, minLength, maxLength, equals, composeValidators } from '../validation';

/**
 * Schema de validación para el formulario de registro
 */
export const registerSchema: ValidationSchema = {
  name: 'register',
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
        password('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número'),
      ],
    },
    {
      name: 'confirmPassword',
      validators: [
        required('Por favor confirma tu contraseña'),
        equals('contraseña', 'password', 'Las contraseñas no coinciden'),
      ],
    },
    {
      name: 'firstName',
      validators: [
        required('El nombre es requerido'),
        minLength(2, 'El nombre debe tener al menos 2 caracteres'),
        maxLength(50, 'El nombre no puede exceder 50 caracteres'),
      ],
    },
    {
      name: 'lastName',
      validators: [
        required('El apellido es requerido'),
        minLength(2, 'El apellido debe tener al menos 2 caracteres'),
        maxLength(50, 'El apellido no puede exceder 50 caracteres'),
      ],
    },
  ],
};

/**
 * Valores iniciales del formulario de registro
 */
export const registerInitialValues = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
};

/**
 * Mensajes de error personalizados para registro
 */
export const registerCustomMessages = {
  email: undefined,
  password: undefined,
  confirmPassword: undefined,
  firstName: undefined,
  lastName: undefined,
};

export default registerSchema;

/**
 * Schema de validación de Perfil - KogniRecovery
 * Valida los campos del formulario de perfil de usuario
 */

import { ValidationSchema } from '../validation';
import { 
  required, 
  email, 
  minLength, 
  maxLength, 
  phone, 
  date, 
  country,
  optional 
} from '../validation';

/**
 * Schema de validación para el formulario de perfil
 */
export const profileSchema: ValidationSchema = {
  name: 'profile',
  fields: [
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
    {
      name: 'email',
      validators: [
        required('El correo electrónico es requerido'),
        email('Ingresa un correo electrónico válido'),
      ],
    },
    {
      name: 'phone',
      validators: [
        optional(phone('Ingresa un número de teléfono válido')),
      ],
    },
    {
      name: 'dateOfBirth',
      validators: [
        optional(
          date('Ingresa una fecha válida', {
            allowFuture: false,
            allowPast: true,
          })
        ),
      ],
    },
    {
      name: 'country',
      validators: [
        optional(country('Selecciona un país válido')),
      ],
    },
    {
      name: 'city',
      validators: [
        optional(
          minLength(2, 'La ciudad debe tener al menos 2 caracteres')
        ),
        optional(
          maxLength(50, 'La ciudad no puede exceder 50 caracteres')
        ),
      ],
    },
    {
      name: 'address',
      validators: [
        optional(
          minLength(5, 'La dirección debe tener al menos 5 caracteres')
        ),
        optional(
          maxLength(100, 'La dirección no puede exceder 100 caracteres')
        ),
      ],
    },
    {
      name: 'emergencyPhone',
      validators: [
        optional(phone('Ingresa un número de teléfono válido')),
      ],
    },
    {
      name: 'medicalNotes',
      validators: [
        optional(
          maxLength(500, 'Las notas médicas no pueden exceder 500 caracteres')
        ),
      ],
    },
  ],
};

/**
 * Valores iniciales del formulario de perfil
 */
export const profileInitialValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  country: '',
  city: '',
  address: '',
  emergencyPhone: '',
  medicalNotes: '',
};

/**
 * Mensajes de error personalizados para perfil
 */
export const profileCustomMessages = {
  firstName: undefined,
  lastName: undefined,
  email: undefined,
  phone: undefined,
  dateOfBirth: undefined,
  country: undefined,
  city: undefined,
  address: undefined,
  emergencyPhone: undefined,
  medicalNotes: undefined,
};

export default profileSchema;

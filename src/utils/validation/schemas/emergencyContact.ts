/**
 * Schema de validación de Contacto de Emergencia - KogniRecovery
 * Valida los campos del formulario de contacto de emergencia
 */

import { ValidationSchema } from '../validation';
import { 
  required, 
  minLength, 
  maxLength, 
  phone, 
  country,
  optional,
  email 
} from '../validation';

/**
 * Schema de validación para el formulario de contacto de emergencia
 */
export const emergencyContactSchema: ValidationSchema = {
  name: 'emergencyContact',
  fields: [
    {
      name: 'firstName',
      validators: [
        required('El nombre del contacto es requerido'),
        minLength(2, 'El nombre debe tener al menos 2 caracteres'),
        maxLength(50, 'El nombre no puede exceder 50 caracteres'),
      ],
    },
    {
      name: 'lastName',
      validators: [
        required('El apellido del contacto es requerido'),
        minLength(2, 'El apellido debe tener al menos 2 caracteres'),
        maxLength(50, 'El apellido no puede exceder 50 caracteres'),
      ],
    },
    {
      name: 'relationship',
      validators: [
        required('La relación es requerida'),
        minLength(2, 'La relación debe tener al menos 2 caracteres'),
        maxLength(50, 'La relación no puede exceder 50 caracteres'),
      ],
    },
    {
      name: 'phone',
      validators: [
        required('El número de teléfono es requerido'),
        phone('Ingresa un número de teléfono válido'),
      ],
    },
    {
      name: 'alternatePhone',
      validators: [
        optional(phone('Ingresa un número de teléfono válido')),
      ],
    },
    {
      name: 'email',
      validators: [
        optional(email('Ingresa un correo electrónico válido')),
      ],
    },
    {
      name: 'country',
      validators: [
        required('El país es requerido'),
        country('Selecciona un país válido'),
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
      name: 'priority',
      validators: [
        optional(
          minLength(1, 'La prioridad es requerida')
        ),
      ],
    },
    {
      name: 'notes',
      validators: [
        optional(
          maxLength(200, 'Las notas no pueden exceder 200 caracteres')
        ),
      ],
    },
  ],
};

/**
 * Valores iniciales del formulario de contacto de emergencia
 */
export const emergencyContactInitialValues = {
  firstName: '',
  lastName: '',
  relationship: '',
  phone: '',
  alternatePhone: '',
  email: '',
  country: '',
  city: '',
  address: '',
  priority: 'secondary',
  notes: '',
};

/**
 * Opciones de relación para el contacto de emergencia
 */
export const RELATIONSHIP_OPTIONS = [
  { label: 'Cónyuge', value: 'spouse' },
  { label: 'Padre/Madre', value: 'parent' },
  { label: 'Hijo/Hija', value: 'child' },
  { label: 'Hermano/Hermana', value: 'sibling' },
  { label: 'Amigo/Amiga', value: 'friend' },
  { label: 'Doctor/Doctora', value: 'doctor' },
  { label: 'Otro', value: 'other' },
] as const;

/**
 * Opciones de prioridad para el contacto
 */
export const PRIORITY_OPTIONS = [
  { label: 'Primario', value: 'primary' },
  { label: 'Secundario', value: 'secondary' },
  { label: 'Terciario', value: 'tertiary' },
] as const;

/**
 * Mensajes de error personalizados para contacto de emergencia
 */
export const emergencyContactCustomMessages = {
  firstName: undefined,
  lastName: undefined,
  relationship: undefined,
  phone: undefined,
  alternatePhone: undefined,
  email: undefined,
  country: undefined,
  city: undefined,
  address: undefined,
  priority: undefined,
  notes: undefined,
};

export default emergencyContactSchema;

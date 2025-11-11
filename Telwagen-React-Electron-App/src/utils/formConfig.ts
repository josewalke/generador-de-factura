/**
 * Configuración de formularios
 * Maneja dependencias opcionales y fallbacks
 */

// Verificar si las dependencias avanzadas están disponibles
export const hasAdvancedFormSupport = (() => {
  try {
    require('@hookform/resolvers');
    require('zod');
    return true;
  } catch {
    return false;
  }
})();

// Configuración de validación
export const validationConfig = {
  // Matrícula
  matricula: {
    required: true,
    minLength: 1,
    maxLength: 20,
    pattern: /^[A-Z0-9-]+$/i,
    patternMessage: 'Solo letras, números y guiones'
  },
  
  // Modelo
  modelo: {
    required: true,
    minLength: 1,
    maxLength: 100
  },
  
  // Chasis (VIN)
  chasis: {
    required: true,
    length: 17,
    pattern: /^[A-HJ-NPR-Z0-9]{17}$/i,
    patternMessage: 'Debe ser un VIN válido de 17 caracteres'
  },
  
  // Color
  color: {
    required: true,
    minLength: 1,
    maxLength: 50
  },
  
  // Kilómetros
  kms: {
    min: 0,
    max: 9999999,
    type: 'number'
  }
};

// Mensajes de error estándar
export const errorMessages = {
  required: 'Este campo es obligatorio',
  minLength: (min: number) => `Mínimo ${min} caracteres`,
  maxLength: (max: number) => `Máximo ${max} caracteres`,
  pattern: (message: string) => message,
  min: (min: number) => `Valor mínimo: ${min}`,
  max: (max: number) => `Valor máximo: ${max}`,
  number: 'Debe ser un número válido'
};

// Función de validación simple
export function validateField(field: string, value: any): string | null {
  const config = validationConfig[field as keyof typeof validationConfig];
  if (!config) return null;

  // Validación de campos requeridos
  if (config.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return errorMessages.required;
  }

  // Validación de longitud mínima
  if (config.minLength && typeof value === 'string' && value.length < config.minLength) {
    return errorMessages.minLength(config.minLength);
  }

  // Validación de longitud máxima
  if (config.maxLength && typeof value === 'string' && value.length > config.maxLength) {
    return errorMessages.maxLength(config.maxLength);
  }

  // Validación de longitud exacta
  if (config.length && typeof value === 'string' && value.length !== config.length) {
    return `Debe tener exactamente ${config.length} caracteres`;
  }

  // Validación de patrón
  if (config.pattern && typeof value === 'string' && !config.pattern.test(value)) {
    return errorMessages.pattern(config.patternMessage || 'Formato inválido');
  }

  // Validación de números
  if (config.type === 'number') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return errorMessages.number;
    }
    if (config.min !== undefined && numValue < config.min) {
      return errorMessages.min(config.min);
    }
    if (config.max !== undefined && numValue > config.max) {
      return errorMessages.max(config.max);
    }
  }

  return null;
}

// Función de validación completa del formulario
export function validateCocheForm(data: any): Record<string, string> {
  const errors: Record<string, string> = {};

  Object.keys(validationConfig).forEach(field => {
    const error = validateField(field, data[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
}


















import { z } from 'zod';

/**
 * Esquemas de validación para vehículos usando Zod
 * Proporciona validación robusta y mensajes de error claros
 */

// Esquema base para crear/actualizar coche
export const cocheCreateSchema = z.object({
  matricula: z
    .string()
    .min(1, 'La matrícula es obligatoria')
    .max(20, 'La matrícula no puede exceder 20 caracteres')
    .regex(/^[A-Z0-9-]+$/i, 'La matrícula solo puede contener letras, números y guiones'),
  
  modelo: z
    .string()
    .min(1, 'El modelo es obligatorio')
    .max(100, 'El modelo no puede exceder 100 caracteres'),
  
  chasis: z
    .string()
    .min(1, 'El chasis (VIN) es obligatorio')
    .max(17, 'El chasis debe tener exactamente 17 caracteres')
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/i, 'El chasis debe ser un VIN válido'),
  
  color: z
    .string()
    .min(1, 'El color es obligatorio')
    .max(50, 'El color no puede exceder 50 caracteres'),
  
  kms: z
    .number()
    .min(0, 'Los kilómetros deben ser positivos')
    .max(9999999, 'Los kilómetros no pueden exceder 9,999,999')
    .int('Los kilómetros deben ser un número entero')
});

// Esquema para actualización parcial
export const cocheUpdateSchema = cocheCreateSchema.partial();

// Esquema para búsqueda
export const cocheSearchSchema = z.object({
  searchTerm: z
    .string()
    .min(1, 'El término de búsqueda es obligatorio')
    .max(100, 'El término de búsqueda no puede exceder 100 caracteres')
});

// Esquema para filtros
export const cocheFilterSchema = z.object({
  estado: z.enum(['todos', 'disponibles', 'vendidos']).default('todos'),
  tipo: z.enum(['todos', 'nuevos', 'usados']).optional(),
  rangoKms: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional()
  }).optional()
});

// Tipos TypeScript derivados de los esquemas
export type CocheCreateData = z.infer<typeof cocheCreateSchema>;
export type CocheUpdateData = z.infer<typeof cocheUpdateSchema>;
export type CocheSearchData = z.infer<typeof cocheSearchSchema>;
export type CocheFilterData = z.infer<typeof cocheFilterSchema>;

// Función helper para validar datos
export function validateCocheData(data: unknown): CocheCreateData {
  return cocheCreateSchema.parse(data);
}

// Función helper para validar actualización
export function validateCocheUpdate(data: unknown): CocheUpdateData {
  return cocheUpdateSchema.parse(data);
}

// Función helper para obtener errores de validación
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return errors;
}


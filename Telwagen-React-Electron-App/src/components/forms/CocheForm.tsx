import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { Coche } from '../../services';
import { 
  cocheCreateSchema, 
  CocheCreateData, 
  getValidationErrors 
} from '../../schemas/cocheSchema';
import { logger } from '../../utils/logger';

interface CocheFormProps {
  coche?: Coche | null;
  onSubmit: (data: CocheCreateData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CocheForm({ coche, onSubmit, onCancel, isLoading = false }: CocheFormProps) {
  const isEditing = !!coche;
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    setError
  } = useForm<CocheCreateData>({
    resolver: zodResolver(cocheCreateSchema),
    mode: 'onChange',
    defaultValues: {
      matricula: coche?.matricula || '',
      modelo: coche?.modelo || '',
      chasis: coche?.chasis || '',
      color: coche?.color || '',
      kms: coche?.kms || 0
    }
  });

  // Resetear formulario cuando cambie el coche
  React.useEffect(() => {
    if (coche) {
      reset({
        matricula: coche.matricula || '',
        modelo: coche.modelo || '',
        chasis: coche.chasis || '',
        color: coche.color || '',
        kms: coche.kms || 0
      });
    } else {
      reset({
        matricula: '',
        modelo: '',
        chasis: '',
        color: '',
        kms: 0
      });
    }
  }, [coche, reset]);

  const onFormSubmit = async (data: CocheCreateData) => {
    try {
      logger.formularioCoche.debug('Enviando formulario de coche', { 
        isEditing, 
        data: { ...data, kms: data.kms } 
      });
      
      await onSubmit(data);
      
      logger.formularioCoche.info('Formulario enviado exitosamente');
    } catch (error: any) {
      logger.formularioCoche.error('Error al enviar formulario', error);
      
      // Manejar errores de validación del servidor
      if (error?.response?.status === 400 && error?.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        Object.keys(serverErrors).forEach(field => {
          setError(field as keyof CocheCreateData, {
            type: 'server',
            message: serverErrors[field]
          });
        });
      }
    }
  };

  const isFormLoading = isSubmitting || isLoading;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Matrícula */}
      <div>
        <Label htmlFor="matricula">Matrícula *</Label>
        <Input
          id="matricula"
          {...register('matricula')}
          placeholder="1234-ABC"
          disabled={isFormLoading}
          className={errors.matricula ? 'border-red-500' : ''}
        />
        {errors.matricula && (
          <p className="text-sm text-red-600 mt-1">{errors.matricula.message}</p>
        )}
      </div>

      {/* Modelo */}
      <div>
        <Label htmlFor="modelo">Modelo *</Label>
        <Input
          id="modelo"
          {...register('modelo')}
          placeholder="Nissan Qashqai"
          disabled={isFormLoading}
          className={errors.modelo ? 'border-red-500' : ''}
        />
        {errors.modelo && (
          <p className="text-sm text-red-600 mt-1">{errors.modelo.message}</p>
        )}
      </div>

      {/* Chasis */}
      <div>
        <Label htmlFor="chasis">Chasis (VIN) *</Label>
        <Input
          id="chasis"
          {...register('chasis')}
          placeholder="VF1RFA00012345678"
          disabled={isFormLoading}
          className={errors.chasis ? 'border-red-500' : ''}
        />
        {errors.chasis && (
          <p className="text-sm text-red-600 mt-1">{errors.chasis.message}</p>
        )}
      </div>

      {/* Color y Kilómetros */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="color">Color *</Label>
          <Input
            id="color"
            {...register('color')}
            placeholder="Blanco"
            disabled={isFormLoading}
            className={errors.color ? 'border-red-500' : ''}
          />
          {errors.color && (
            <p className="text-sm text-red-600 mt-1">{errors.color.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="kms">Kilómetros</Label>
          <Input
            id="kms"
            type="number"
            {...register('kms', { valueAsNumber: true })}
            min="0"
            placeholder="0"
            disabled={isFormLoading}
            className={errors.kms ? 'border-red-500' : ''}
          />
          {errors.kms && (
            <p className="text-sm text-red-600 mt-1">{errors.kms.message}</p>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Los campos marcados con * son obligatorios. 
          Los vehículos con 0 km se consideran nuevos.
        </AlertDescription>
      </Alert>

      {/* Botones */}
      <div className="flex space-x-2 pt-4">
        <Button 
          type="submit" 
          className="flex-1" 
          disabled={isFormLoading || !isValid}
        >
          {isFormLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEditing ? 'Actualizando...' : 'Creando...'}
            </>
          ) : (
            isEditing ? 'Actualizar Vehículo' : 'Crear Vehículo'
          )}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isFormLoading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}


















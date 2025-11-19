import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { Coche } from '../../services';
import { logger } from '../../utils/logger';
import { validateCocheForm } from '../../utils/formConfig';

interface CocheFormSimpleProps {
  coche?: Coche | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CocheFormSimple({ coche, onSubmit, onCancel, isLoading = false }: CocheFormSimpleProps) {
  const isEditing = !!coche;
  
  const [formData, setFormData] = useState({
    matricula: '',
    marca: '',
    modelo: '',
    chasis: '',
    color: '',
    kms: 0
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar formulario
  useEffect(() => {
    if (coche) {
      setFormData({
        matricula: coche.matricula || '',
        marca: coche.marca || '',
        modelo: coche.modelo || '',
        chasis: coche.chasis || '',
        color: coche.color || '',
        kms: coche.kms || 0
      });
    } else {
      setFormData({
        matricula: '',
        marca: '',
        modelo: '',
        chasis: '',
        color: '',
        kms: 0
      });
    }
    setErrors({});
  }, [coche]);

  // Validación usando configuración centralizada
  const validateForm = () => {
    const newErrors = validateCocheForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isLoading) {
      return;
    }

    if (!validateForm()) {
      logger.formularioCoche.warn('Formulario inválido', errors);
      return;
    }

    try {
      setIsSubmitting(true);
      logger.formularioCoche.debug('Enviando formulario', { 
        isEditing, 
        data: formData 
      });
      
      await onSubmit(formData);
      
      logger.formularioCoche.info('Formulario enviado exitosamente');
    } catch (error: any) {
      logger.formularioCoche.error('Error al enviar formulario', error);
      
      // Manejar errores específicos del servidor
      if (error?.response?.status === 400 && error?.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        setErrors(serverErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormLoading = isSubmitting || isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Matrícula */}
      <div>
        <Label htmlFor="matricula">Matrícula *</Label>
        <Input
          id="matricula"
          value={formData.matricula}
          onChange={(e) => handleInputChange('matricula', e.target.value)}
          placeholder="1234-ABC"
          disabled={isFormLoading}
          className={errors.matricula ? 'border-red-500' : ''}
        />
        {errors.matricula && (
          <p className="text-sm text-red-600 mt-1">{errors.matricula}</p>
        )}
      </div>

      {/* Marca y Modelo */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="marca">Marca *</Label>
          <Input
            id="marca"
            value={formData.marca}
            onChange={(e) => handleInputChange('marca', e.target.value)}
            placeholder="Nissan"
            disabled={isFormLoading}
            className={errors.marca ? 'border-red-500' : ''}
          />
          {errors.marca && (
            <p className="text-sm text-red-600 mt-1">{errors.marca}</p>
          )}
        </div>
        <div>
          <Label htmlFor="modelo">Modelo *</Label>
          <Input
            id="modelo"
            value={formData.modelo}
            onChange={(e) => handleInputChange('modelo', e.target.value)}
            placeholder="Qashqai"
            disabled={isFormLoading}
            className={errors.modelo ? 'border-red-500' : ''}
          />
          {errors.modelo && (
            <p className="text-sm text-red-600 mt-1">{errors.modelo}</p>
          )}
        </div>
      </div>

      {/* Chasis */}
      <div>
        <Label htmlFor="chasis">Chasis (VIN) *</Label>
        <Input
          id="chasis"
          value={formData.chasis}
          onChange={(e) => handleInputChange('chasis', e.target.value.toUpperCase())}
          placeholder="VF1RFA00012345678"
          disabled={isFormLoading}
          className={errors.chasis ? 'border-red-500' : ''}
          maxLength={17}
        />
        {errors.chasis && (
          <p className="text-sm text-red-600 mt-1">{errors.chasis}</p>
        )}
      </div>

      {/* Color y Kilómetros */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="color">Color *</Label>
          <Input
            id="color"
            value={formData.color}
            onChange={(e) => handleInputChange('color', e.target.value)}
            placeholder="Blanco"
            disabled={isFormLoading}
            className={errors.color ? 'border-red-500' : ''}
          />
          {errors.color && (
            <p className="text-sm text-red-600 mt-1">{errors.color}</p>
          )}
        </div>

        <div>
          <Label htmlFor="kms">Kilómetros</Label>
          <Input
            id="kms"
            type="number"
            value={formData.kms}
            onChange={(e) => handleInputChange('kms', parseInt(e.target.value) || 0)}
            min="0"
            max="9999999"
            placeholder="0"
            disabled={isFormLoading}
            className={errors.kms ? 'border-red-500' : ''}
          />
          {errors.kms && (
            <p className="text-sm text-red-600 mt-1">{errors.kms}</p>
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
          disabled={isFormLoading}
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

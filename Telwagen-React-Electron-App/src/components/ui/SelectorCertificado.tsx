import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Alert, AlertDescription } from '../ui/alert';
import { useCertificados, CertificadoDigital } from '../../hooks/useCertificados';
import { RefreshCw, Shield, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface SelectorCertificadoProps {
  certificadoSeleccionado?: string;
  onSeleccionarCertificado: (certificado: CertificadoDigital | null) => void;
  onCancelar: () => void;
}

export function SelectorCertificado({ 
  certificadoSeleccionado, 
  onSeleccionarCertificado, 
  onCancelar 
}: SelectorCertificadoProps) {
  const { certificados, loading, error, refreshCertificados } = useCertificados();
  const [certificadoActual, setCertificadoActual] = useState<CertificadoDigital | null>(null);

  useEffect(() => {
    refreshCertificados();
  }, [refreshCertificados]);

  const handleSeleccionar = (certificado: CertificadoDigital) => {
    setCertificadoActual(certificado);
  };

  const handleConfirmar = () => {
    onSeleccionarCertificado(certificadoActual);
  };

  const getEstadoCertificado = (certificado: CertificadoDigital) => {
    if (!certificado.IsValid) {
      return { color: 'destructive', icon: AlertCircle, text: 'Inválido' };
    }
    
    if (certificado.DaysUntilExpiry && certificado.DaysUntilExpiry < 30) {
      return { color: 'secondary', icon: Clock, text: 'Próximo a vencer' };
    }
    
    return { color: 'default', icon: CheckCircle, text: 'Válido' };
  };

  const formatearFecha = (fecha?: string | null, esEstimada: boolean = false) => {
    if (!fecha || fecha === null || fecha === 'null') return 'No disponible';
    
    try {
      // Intentar parsear la fecha
      const fechaParsed = new Date(fecha);
      
      // Verificar si la fecha es válida
      if (isNaN(fechaParsed.getTime())) {
        console.log('🔍 [SelectorCertificado] Fecha inválida:', fecha);
        return 'Fecha inválida';
      }
      
      const fechaFormateada = fechaParsed.toLocaleDateString('es-ES');
      return esEstimada ? `${fechaFormateada} (estimada)` : fechaFormateada;
    } catch (error) {
      console.error('🔍 [SelectorCertificado] Error al formatear fecha:', error, 'Fecha:', fecha);
      return 'Error en fecha';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Seleccionar Certificado Digital</span>
        </h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              console.log('🔍 [SelectorCertificado] Debug - Certificados actuales:', certificados);
              console.log('🔍 [SelectorCertificado] Debug - Estado de carga:', loading);
              console.log('🔍 [SelectorCertificado] Debug - Error:', error);
            }}
          >
            Debug
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshCertificados}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Detectando certificados disponibles...</p>
        </div>
      ) : certificados.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se encontraron certificados digitales instalados en el sistema.
            Asegúrate de tener certificados válidos instalados en el almacén de certificados de Windows.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {certificados.map((certificado, index) => {
            const estado = getEstadoCertificado(certificado);
            const IconoEstado = estado.icon;
            const isSelected = certificadoActual?.SerialNumber === certificado.SerialNumber;
            
            return (
              <Card 
                key={certificado.SerialNumber || index}
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleSeleccionar(certificado)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center space-x-2">
                        <span>{certificado.CommonName || 'Certificado sin nombre'}</span>
                        <Badge variant={estado.color as any} className="text-xs">
                          <IconoEstado className="h-3 w-3 mr-1" />
                          {estado.text}
                        </Badge>
                      </CardTitle>
                      {certificado.CIF && (
                        <p className="text-sm text-gray-600 mt-1">
                          CIF: {certificado.CIF}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <p className="font-medium">Válido desde:</p>
                      <p>{formatearFecha(certificado.NotBefore, !certificado.validoDesde)}</p>
                      {console.log('🔍 [SelectorCertificado] NotBefore:', certificado.NotBefore, 'validoDesde:', certificado.validoDesde)}
                    </div>
                    <div>
                      <p className="font-medium">Válido hasta:</p>
                      <p>{formatearFecha(certificado.NotAfter, !certificado.validoHasta)}</p>
                      {console.log('🔍 [SelectorCertificado] NotAfter:', certificado.NotAfter, 'validoHasta:', certificado.validoHasta)}
                    </div>
                    {certificado.DaysUntilExpiry && (
                      <div className="col-span-2">
                        <p className="font-medium">Días restantes:</p>
                        <p className="text-blue-600">
                          {certificado.DaysUntilExpiry} días
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex space-x-2 pt-4">
        <Button 
          onClick={handleConfirmar}
          disabled={!certificadoActual}
          className="flex-1"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Seleccionar Certificado
        </Button>
        <Button variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

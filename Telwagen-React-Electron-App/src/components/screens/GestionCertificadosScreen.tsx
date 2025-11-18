import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Screen } from '../../App';
import { useCertificados, CertificadoDigital } from '../../hooks/useCertificados';
import { excelService } from '../../services/excelService';
import { Shield, RefreshCw, Download, AlertCircle, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react';

interface GestionCertificadosScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function GestionCertificadosScreen({ onNavigate }: GestionCertificadosScreenProps) {
  const { certificados, loading, error, refreshCertificados } = useCertificados();
  const [certificadoSeleccionado, setCertificadoSeleccionado] = useState<CertificadoDigital | null>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'validos' | 'invalidos' | 'proximos'>('todos');

  useEffect(() => {
    refreshCertificados();
  }, [refreshCertificados]);

  const certificadosFiltrados = certificados.filter(certificado => {
    switch (filtroEstado) {
      case 'validos':
        return certificado.IsValid;
      case 'invalidos':
        return !certificado.IsValid;
      case 'proximos':
        return certificado.IsValid && certificado.DaysUntilExpiry && certificado.DaysUntilExpiry < 30;
      default:
        return true;
    }
  });

  const stats = {
    total: certificados.length,
    validos: certificados.filter(c => c.IsValid).length,
    invalidos: certificados.filter(c => !c.IsValid).length,
    proximos: certificados.filter(c => c.IsValid && c.DaysUntilExpiry && c.DaysUntilExpiry < 30).length
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

  const formatearFecha = (fecha?: string | null) => {
    if (!fecha || fecha === null || fecha === 'null') return 'No disponible';
    
    try {
      const fechaParsed = new Date(fecha);
      if (isNaN(fechaParsed.getTime())) return 'Fecha inválida';
      return fechaParsed.toLocaleDateString('es-ES');
    } catch (error) {
      return 'Error en fecha';
    }
  };

  const handleExportarCertificados = () => {
    try {
      excelService.exportCertificados(certificados, {
        filename: 'certificados_digitales',
        sheetName: 'Certificados'
      });
    } catch (error) {
      console.error('Error al exportar certificados:', error);
    }
  };

  const handleVerDetalles = (certificado: CertificadoDigital) => {
    setCertificadoSeleccionado(certificado);
    setMostrarDetalles(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => onNavigate('empresas')}
                className="flex items-center space-x-2"
              >
                <span>←</span>
                <span>Volver a Empresas</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <Shield className="h-6 w-6" />
                  <span>Gestión de Certificados Digitales</span>
                </h1>
                <p className="text-gray-600">Administración y monitoreo de certificados</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={refreshCertificados} variant="outline" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button onClick={handleExportarCertificados} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Certificados</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Válidos</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.validos}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Inválidos</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.invalidos}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Próximos a Vencer</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.proximos}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Certificados Instalados</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant={filtroEstado === 'todos' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltroEstado('todos')}
                  >
                    Todos ({stats.total})
                  </Button>
                  <Button
                    variant={filtroEstado === 'validos' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltroEstado('validos')}
                  >
                    Válidos ({stats.validos})
                  </Button>
                  <Button
                    variant={filtroEstado === 'invalidos' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltroEstado('invalidos')}
                  >
                    Inválidos ({stats.invalidos})
                  </Button>
                  <Button
                    variant={filtroEstado === 'proximos' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltroEstado('proximos')}
                  >
                    Próximos ({stats.proximos})
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading && <p className="text-center py-4">Cargando certificados...</p>}
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {!loading && certificadosFiltrados.length === 0 && (
                  <p className="text-center py-8 text-gray-500">
                    No se encontraron certificados con el filtro seleccionado.
                  </p>
                )}
                {!loading && certificadosFiltrados.length > 0 && (
                  <div className="space-y-3">
                    {certificadosFiltrados.map((certificado, index) => {
                      const estado = getEstadoCertificado(certificado);
                      const IconoEstado = estado.icon;
                      
                      return (
                        <Card key={certificado.SerialNumber || index} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold">{certificado.CommonName}</h3>
                                  <Badge variant={estado.color as any} className="text-xs">
                                    <IconoEstado className="h-3 w-3 mr-1" />
                                    {estado.text}
                                  </Badge>
                                </div>
                                {certificado.CIF && (
                                  <p className="text-sm text-gray-600 mb-1">CIF: {certificado.CIF}</p>
                                )}
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                  <div>
                                    <p className="font-medium">Válido desde:</p>
                                    <p>{formatearFecha(certificado.NotBefore)}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Válido hasta:</p>
                                    <p>{formatearFecha(certificado.NotAfter)}</p>
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
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVerDetalles(certificado)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver Detalles
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Acciones Rápidas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={refreshCertificados}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar Certificados
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleExportarCertificados}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar a Excel
                </Button>
              </CardContent>
            </Card>

            {/* Información */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>Información</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>Los certificados se detectan automáticamente desde el almacén de Windows.</p>
                <p>Los certificados próximos a vencer (menos de 30 días) requieren renovación.</p>
                <p>Puedes exportar la lista completa a Excel para análisis externos.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Diálogo de Detalles */}
      <Dialog open={mostrarDetalles} onOpenChange={setMostrarDetalles}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Certificado</DialogTitle>
            <DialogDescription>
              Información completa del certificado digital seleccionado.
            </DialogDescription>
          </DialogHeader>
          {certificadoSeleccionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-gray-600">Nombre de Organización</p>
                  <p className="text-lg">{certificadoSeleccionado.CommonName}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">CIF</p>
                  <p>{certificadoSeleccionado.CIF || 'No disponible'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Estado</p>
                  <Badge variant={certificadoSeleccionado.IsValid ? 'default' : 'destructive'}>
                    {certificadoSeleccionado.IsValid ? 'Válido' : 'Inválido'}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Días Restantes</p>
                  <p className="text-blue-600">
                    {certificadoSeleccionado.DaysUntilExpiry || 'N/A'} días
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Serial Number</p>
                  <p className="text-xs font-mono">{certificadoSeleccionado.SerialNumber}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Thumbprint</p>
                  <p className="text-xs font-mono">{certificadoSeleccionado.Thumbprint}</p>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-600">Subject Completo</p>
                <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                  {certificadoSeleccionado.Subject}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Screen } from '../../App';
import { useCoches } from '../../hooks';
import { useDebounce } from '../../hooks/useDebounce';
import { Coche, CocheCreateData } from '../../services';
import { excelService } from '../../services/excelService';
import { proformaService, Proforma } from '../../services/proformaService';
import { CocheFormSimple } from '../forms/CocheFormSimple';
import { CochesErrorBoundary } from '../ErrorBoundary';
import { logger } from '../../utils/logger';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Search, Edit, AlertCircle, RefreshCw, Car, Download, X, BarChart3, Upload, Trash2, FileText, Building2, User, ClipboardList, StickyNote } from 'lucide-react';
import '../../styles/proforma-modal.css';

interface CochesScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function CochesScreen({ onNavigate }: CochesScreenProps) {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cocheEditando, setCocheEditando] = useState<Coche | null>(null);
  const [vistaActual, setVistaActual] = useState<'tabla' | 'tarjetas'>('tabla');
  const [filtroActual, setFiltroActual] = useState<'todos' | 'disponibles' | 'vendidos'>('todos');
  const [mostrarDialogImportar, setMostrarDialogImportar] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultadoImportacion, setResultadoImportacion] = useState<{ importados: number; errores: number; erroresDetalle?: any[] } | null>(null);
  const [mostrarDialogEliminar, setMostrarDialogEliminar] = useState(false);
  const [cocheAEliminar, setCocheAEliminar] = useState<{ id: string; matricula: string } | null>(null);
  const [mostrarDialogProforma, setMostrarDialogProforma] = useState(false);
  const [proformaSeleccionada, setProformaSeleccionada] = useState<Proforma | null>(null);
  const [cargandoProforma, setCargandoProforma] = useState(false);

  // Debounce para optimizar búsquedas
  const debouncedBusqueda = useDebounce(busqueda, 300);

  const {
    coches,
    cochesDisponibles,
    cochesVendidos,
    loading,
    error,
    createCoche,
    updateCoche,
    deleteCoche,
    searchCoches,
    refreshCoches,
    clearError
  } = useCoches();

  // Filtrar coches según el filtro seleccionado
  const cochesFiltrados = useMemo(() => {
    let cochesParaFiltrar = coches;
    
    switch (filtroActual) {
      case 'disponibles':
        cochesParaFiltrar = cochesDisponibles;
        break;
      case 'vendidos':
        cochesParaFiltrar = cochesVendidos;
        break;
      default:
        cochesParaFiltrar = coches;
    }

    if (!debouncedBusqueda.trim()) {
      return cochesParaFiltrar;
    }

    const searchLower = debouncedBusqueda.toLowerCase();
    return cochesParaFiltrar.filter(coche =>
      (coche.matricula?.toLowerCase() || '').includes(searchLower) ||
      (coche.modelo?.toLowerCase() || '').includes(searchLower) ||
      (coche.color?.toLowerCase() || '').includes(searchLower) ||
      (coche.chasis?.toLowerCase() || '').includes(searchLower)
    );
  }, [coches, cochesDisponibles, cochesVendidos, filtroActual, debouncedBusqueda]);

  const stats = useMemo(() => ({
    total: coches.length,
    disponibles: cochesDisponibles.length,
    vendidos: cochesVendidos.length,
    nuevos: coches.filter(c => c.kms === 0).length,
    usados: coches.filter(c => c.kms > 0).length
  }), [coches, cochesDisponibles, cochesVendidos]);

  const handleVerProforma = async (cocheId: string) => {
    try {
      setCargandoProforma(true);
      setMostrarDialogProforma(true);
      
      // Buscar la proforma asociada al coche
      const response = await proformaService.getAll({ coche_id: cocheId, limit: 1 });
      
      if (response.data && response.data.length > 0) {
        // Obtener detalles completos de la proforma
        const proformaCompleta = await proformaService.getById(response.data[0].id);
        setProformaSeleccionada(proformaCompleta);
      }
    } catch (error) {
      console.error('Error al cargar proforma:', error);
      toast.error('Error al cargar la proforma');
    } finally {
      setCargandoProforma(false);
    }
  };

  const handleCrearCoche = async (cocheData: CocheCreateData) => {
    try {
      logger.cochesScreen.debug('Creando nuevo coche', cocheData);
      await createCoche(cocheData);
      setMostrarFormulario(false);
      setCocheEditando(null);
    } catch (error) {
      logger.cochesScreen.error('Error al crear coche', error);
      // El error ya se maneja en el hook con toast
    }
  };



  const handleActualizarCoche = async (cocheData: CocheCreateData) => {
    if (!cocheEditando) {
      logger.cochesScreen.error('No hay coche para editar');
      return;
    }
    
    try {
      logger.cochesScreen.debug('Actualizando coche', { 
        id: cocheEditando.id, 
        data: cocheData 
      });
      
      await updateCoche(cocheEditando.id, cocheData);
      setMostrarFormulario(false);
      setCocheEditando(null);
    } catch (error) {
      logger.cochesScreen.error('Error al actualizar coche', error);
      // El error ya se maneja en el hook con toast
    }
  };

  const abrirEdicion = (coche: Coche) => {
    // Verificar si el coche está vendido
    if (coche.vendido === 1 || coche.vendido === true) {
      toast.error('No se puede editar un vehículo vendido. Los datos deben mantenerse intactos para cumplir con la Ley Antifraude.');
      logger.cochesScreen.warn('Intento de editar coche vendido', { id: coche.id, matricula: coche.matricula });
      return;
    }
    
    logger.cochesScreen.debug('Abriendo edición de coche', { id: coche.id });
    setCocheEditando(coche);
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    logger.cochesScreen.debug('Cerrando formulario');
    setMostrarFormulario(false);
    setCocheEditando(null);
  };

  const abrirDialogEliminar = (coche: Coche) => {
    if (coche.vendido === 1 || coche.vendido === true) {
      toast.error('No se puede eliminar un vehículo vendido. Debe conservarse para cumplir con la Ley Antifraude.');
      logger.cochesScreen.warn('Intento de eliminar coche vendido', { id: coche.id, matricula: coche.matricula });
      return;
    }

    setCocheAEliminar({ id: coche.id, matricula: coche.matricula });
    setMostrarDialogEliminar(true);
  };

  const confirmarEliminarCoche = async () => {
    if (!cocheAEliminar) return;
    
    try {
      logger.cochesScreen.debug('Eliminando coche', { id: cocheAEliminar.id });
      await deleteCoche(cocheAEliminar.id);
      setMostrarDialogEliminar(false);
      setCocheAEliminar(null);
    } catch (error) {
      logger.cochesScreen.error('Error al eliminar coche', error);
      // El error ya se maneja en el hook con toast
    }
  };

  const handleExportarCoches = () => {
    try {
      logger.cochesScreen.debug('Exportando coches a Excel', { 
        count: cochesFiltrados.length 
      });
      
      excelService.exportCoches(cochesFiltrados, {
        filename: 'inventario_vehiculos',
        sheetName: 'Inventario'
      });
      
      toast.success(`Exportados ${cochesFiltrados.length} vehículos exitosamente`);
      logger.cochesScreen.info('Exportación completada');
    } catch (error) {
      logger.cochesScreen.error('Error al exportar coches', error);
      toast.error('Error al exportar vehículos');
    }
  };

  const handleImportarCoches = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea un archivo Excel
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Por favor, selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    try {
      setImportando(true);
      setResultadoImportacion(null);
      logger.cochesScreen.debug('Importando coches desde Excel', { filename: file.name });

      const resultado = await excelService.importCoches(file);
      
      setResultadoImportacion(resultado);
      
      if (resultado.success) {
        toast.success(`Importación completada: ${resultado.importados} vehículos importados${resultado.errores > 0 ? `, ${resultado.errores} errores` : ''}`);
        // Recargar la lista de coches
        await refreshCoches();
      } else {
        toast.error(`Error en la importación: ${resultado.errores} errores`);
      }
      
      logger.cochesScreen.info('Importación completada', resultado);
    } catch (error: any) {
      logger.cochesScreen.error('Error al importar coches', error);
      toast.error(error.message || 'Error al importar vehículos');
    } finally {
      setImportando(false);
      // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
      event.target.value = '';
    }
  };

  const handleBusqueda = async () => {
    if (debouncedBusqueda.trim()) {
      await searchCoches(debouncedBusqueda);
    } else {
      await refreshCoches();
    }
  };

  // Efecto para búsqueda automática con debounce
  useEffect(() => {
    if (debouncedBusqueda.trim()) {
      handleBusqueda();
    }
  }, [debouncedBusqueda]);



  return (
    <CochesErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => onNavigate('dashboard')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Volver al Dashboard</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                    <Car className="h-6 w-6" />
                    <span>Inventario de Vehículos</span>
                  </h1>
                  <p className="text-gray-600">Gestión completa del inventario de coches</p>
                </div>
              </div>
            </div>
          </div>
        </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-4 space-y-6">
            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Car className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Vehículos</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Car className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Disponibles</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.disponibles}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Car className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Vendidos</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.vendidos}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controles */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5" />
                    <span>Inventario de Vehículos</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Tabs value={vistaActual} onValueChange={(value) => setVistaActual(value as 'tabla' | 'tarjetas')}>
                      <TabsList>
                        <TabsTrigger value="tabla">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Tabla
                        </TabsTrigger>
                        <TabsTrigger value="tarjetas">Tarjetas</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
                
                {/* Filtros */}
                <div className="mt-4 flex flex-wrap gap-4">
                  <Tabs value={filtroActual} onValueChange={(value) => setFiltroActual(value as 'todos' | 'disponibles' | 'vendidos')}>
                    <TabsList>
                      <TabsTrigger value="todos">Todos ({stats.total})</TabsTrigger>
                      <TabsTrigger value="disponibles">Disponibles ({stats.disponibles})</TabsTrigger>
                      <TabsTrigger value="vendidos">Vendidos ({stats.vendidos})</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <div className="flex-1 min-w-64">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Buscar por matrícula, modelo, color o chasis..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleBusqueda()}
                      />
                      <Button onClick={handleBusqueda} variant="outline">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading.fetching && <p className="text-center py-4">Cargando vehículos...</p>}
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>{error}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearError}
                        className="ml-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                {!loading.fetching && cochesFiltrados.length === 0 && (
                  <p className="text-center py-8 text-gray-500">
                    {debouncedBusqueda ? 'No se encontraron vehículos con ese criterio de búsqueda.' : 'No hay vehículos para mostrar.'}
                  </p>
                )}
                {!loading.fetching && cochesFiltrados.length > 0 && (
                  <Tabs value={vistaActual}>
                    <TabsContent value="tabla" className="space-y-4">
                      <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Matrícula</TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>Color</TableHead>
                            <TableHead>Kilómetros</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Chasis</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cochesFiltrados.map((coche, index) => (
                            <TableRow key={coche.id || `coche-${index}`}>
                              <TableCell>
                                <p className="font-semibold">{coche.matricula || 'N/A'}</p>
                              </TableCell>
                              <TableCell>
                                <p>{coche.marca || 'N/A'}</p>
                              </TableCell>
                              <TableCell>
                                <p>{coche.modelo || 'N/A'}</p>
                              </TableCell>
                              <TableCell>
                                <p>{coche.color || 'N/A'}</p>
                              </TableCell>
                              <TableCell>
                                <p>{coche.kms ? coche.kms.toLocaleString() + ' km' : 'N/A'}</p>
                              </TableCell>
                              <TableCell>
                                {coche.vendido ? (
                                  <Badge className="bg-blue-100 text-blue-800">Vendido</Badge>
                                ) : coche.numero_proforma ? (
                                  <Badge 
                                    className="bg-purple-100 text-purple-800 cursor-pointer hover:bg-purple-200 transition-colors"
                                    onClick={() => handleVerProforma(coche.id)}
                                  >
                                    Proformado
                                  </Badge>
                                ) : (
                                  <Badge variant="default">Disponible</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <p className="text-sm text-gray-500">{coche.chasis || 'N/A'}</p>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex space-x-2 justify-end">
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    onClick={() => {
                                      onNavigate('proformas');
                                      // Guardar el coche seleccionado en sessionStorage para que ProformasScreen lo use
                                      sessionStorage.setItem('cocheSeleccionadoParaProforma', JSON.stringify(coche));
                                    }}
                                    title="Crear proforma para este vehículo"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    onClick={() => abrirEdicion(coche)}
                                    title={coche.vendido ? "No se puede editar un vehículo vendido" : "Editar vehículo"}
                                    disabled={coche.vendido === 1 || coche.vendido === true}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {/* Botón de eliminar */}
                                  <Button 
                                    variant="destructive" 
                                    size="icon"
                                    onClick={() => abrirDialogEliminar(coche)}
                                    title={coche.vendido ? "Este vehículo está vendido y no puede eliminarse" : "Eliminar vehículo"}
                                    disabled={coche.vendido === 1 || coche.vendido === true}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      </div>
                    </TabsContent>
                  
                    <TabsContent value="tarjetas" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {cochesFiltrados.map((coche, index) => (
                          <Card key={coche.id || `coche-card-${index}`} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold">{coche.modelo || 'N/A'}</h3>
                                  <p className="text-sm text-gray-500">{coche.matricula || 'N/A'}</p>
                                </div>
                                <div>
                                  {coche.vendido ? (
                                    <Badge variant="destructive">Vendido</Badge>
                                  ) : (
                                    <Badge variant="default">Disponible</Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-gray-500">Color</p>
                                  <p>{coche.color || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Kilómetros</p>
                                  <p>{coche.kms ? coche.kms.toLocaleString() + ' km' : 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-gray-500">Chasis</p>
                                  <p className="text-xs">{coche.chasis || 'N/A'}</p>
                                </div>
                                {coche.numero_factura && (
                                  <div className="col-span-2">
                                    <p className="text-gray-500">Factura asociada</p>
                                    <p className="font-semibold text-blue-600">{coche.numero_factura}</p>
                                    {coche.fecha_venta && (
                                      <p className="text-xs text-gray-500">
                                        {new Date(coche.fecha_venta).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex space-x-2 pt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    onNavigate('proformas');
                                    sessionStorage.setItem('cocheSeleccionadoParaProforma', JSON.stringify(coche));
                                  }}
                                  title="Crear proforma para este vehículo"
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Proforma
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => abrirEdicion(coche)}
                                  disabled={coche.vendido === 1 || coche.vendido === true}
                                  title={coche.vendido ? "No se puede editar un vehículo vendido" : "Editar vehículo"}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                                {/* Botón de eliminar */}
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => abrirDialogEliminar(coche)}
                                  title={coche.vendido ? "Este vehículo está vendido y no puede eliminarse" : "Eliminar vehículo"}
                                  disabled={coche.vendido === 1 || coche.vendido === true}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Eliminar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
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
                  <Car className="h-5 w-5" />
                  <span>Acciones Rápidas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    logger.cochesScreen.debug('Abriendo formulario para nuevo coche');
                    setCocheEditando(null);
                    setMostrarFormulario(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Vehículo
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={refreshCoches}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recargar Inventario
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setMostrarDialogImportar(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Lista
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleExportarCoches}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Lista
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
                <p>Gestiona el inventario completo de vehículos con información detallada.</p>
                <p>Los vehículos con 0 km se consideran nuevos.</p>
                <p>El estado "Vendido" se actualiza automáticamente cuando se crea una factura.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

        {/* Formulario de Coche */}
        <Dialog open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {cocheEditando ? 'Editar Vehículo' : 'Nuevo Vehículo'}
              </DialogTitle>
            </DialogHeader>
            <CocheFormSimple 
              coche={cocheEditando}
              onSubmit={cocheEditando ? handleActualizarCoche : handleCrearCoche}
              onCancel={cerrarFormulario}
              isLoading={loading.creating || loading.updating}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog de Importar Coches */}
        <Dialog open={mostrarDialogImportar} onOpenChange={setMostrarDialogImportar}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Importar Vehículos desde Excel</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Selecciona un archivo Excel (.xlsx o .xls) con la lista de vehículos.
                </p>
                <p className="text-xs text-gray-500">
                  El archivo debe contener las columnas: Matrícula, Modelo, Color, Chasis, Kms
                </p>
              </div>

              <div className="space-y-2">
                <label className="block">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportarCoches}
                    disabled={importando}
                    className="hidden"
                    id="file-import-coches"
                  />
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    disabled={importando}
                  >
                    <label htmlFor="file-import-coches" className="cursor-pointer">
                      {importando ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Seleccionar Archivo Excel
                        </>
                      )}
                    </label>
                  </Button>
                </label>
              </div>

              {resultadoImportacion && (
                <div className={`p-4 rounded-lg ${resultadoImportacion.errores > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="space-y-2">
                    <p className={`font-semibold ${resultadoImportacion.errores > 0 ? 'text-yellow-800' : 'text-green-800'}`}>
                      Resultado de la importación:
                    </p>
                    <div className="text-sm space-y-1">
                      <p className="text-green-700">
                        ✅ Vehículos importados: {resultadoImportacion.importados}
                      </p>
                      {resultadoImportacion.errores > 0 && (
                        <p className="text-yellow-700">
                          ⚠️ Errores: {resultadoImportacion.errores}
                        </p>
                      )}
                    </div>
                    {resultadoImportacion.erroresDetalle && resultadoImportacion.erroresDetalle.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        <p className="text-xs font-semibold text-yellow-800 mb-1">Detalles de errores:</p>
                        <ul className="text-xs text-yellow-700 space-y-1">
                          {resultadoImportacion.erroresDetalle.slice(0, 5).map((error: any, index: number) => (
                            <li key={index}>• {error.fila ? `Fila ${error.fila}: ` : ''}{error.mensaje || error}</li>
                          ))}
                          {resultadoImportacion.erroresDetalle.length > 5 && (
                            <li className="text-yellow-600">... y {resultadoImportacion.erroresDetalle.length - 5} errores más</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMostrarDialogImportar(false);
                    setResultadoImportacion(null);
                  }}
                  disabled={importando}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmación para eliminar coche */}
        <AlertDialog open={mostrarDialogEliminar} onOpenChange={setMostrarDialogEliminar}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de eliminar este vehículo?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el vehículo
                {cocheAEliminar && ` con matrícula ${cocheAEliminar.matricula}`}.
                {cocheAEliminar && coches.find(c => c.id === cocheAEliminar.id && c.vendido) && (
                  <span className="block mt-2 text-red-600 font-semibold">
                    ⚠️ Advertencia: Este vehículo está vendido. Eliminarlo puede afectar la integridad de las facturas asociadas.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setMostrarDialogEliminar(false);
                setCocheAEliminar(null);
              }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmarEliminarCoche}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Diálogo para ver información de la proforma */}
        <Dialog open={mostrarDialogProforma} onOpenChange={(open) => {
          setMostrarDialogProforma(open);
          if (!open) setProformaSeleccionada(null);
        }}>
          <DialogContent className="proforma-modal-content">
            <div className="proforma-modal-header">
              <DialogTitle className="proforma-modal-title">
                <div className="proforma-modal-title-icon">
                  <FileText />
                </div>
                Detalle de Proforma
              </DialogTitle>
              <DialogDescription className="proforma-modal-description">
                Información completa de la proforma asociada al vehículo.
              </DialogDescription>
            </div>
            
            {cargandoProforma ? (
              <div className="proforma-loading">
                <RefreshCw />
              </div>
            ) : proformaSeleccionada ? (
              <div className="proforma-modal-body">
                {/* Banner compacto */}
                <div className="proforma-banner">
                  <div className="proforma-banner-left">
                    <span className="proforma-banner-numero">{proformaSeleccionada.numero_proforma}</span>
                  </div>
                  <div className="proforma-banner-right">
                    <div className="proforma-banner-fecha-group">
                      <span className="proforma-banner-label">Emisión</span>
                      <span className="proforma-banner-fecha">{new Date(proformaSeleccionada.fecha_emision).toLocaleDateString('es-ES')}</span>
                    </div>
                    <span className="proforma-banner-badge">
                      {proformaSeleccionada.estado || 'Pendiente'}
                    </span>
                  </div>
                </div>

                {/* Info sin cards: Cliente y Empresa en línea */}
                <div className="proforma-info-grid">
                  <div className="proforma-info-item">
                    <User />
                    <div className="proforma-info-content">
                      <span className="proforma-info-label">Cliente</span>
                      <span className="proforma-info-name">{proformaSeleccionada.cliente_nombre || 'Sin cliente'}</span>
                      {proformaSeleccionada.cliente_identificacion && (
                        <span className="proforma-info-detail">CIF/NIF: {proformaSeleccionada.cliente_identificacion}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="proforma-info-item">
                    <Building2 />
                    <div className="proforma-info-content">
                      <span className="proforma-info-label">Empresa Emisora</span>
                      <span className="proforma-info-name">{proformaSeleccionada.empresa_nombre || 'N/A'}</span>
                      {proformaSeleccionada.empresa_cif && (
                        <span className="proforma-info-detail">CIF: {proformaSeleccionada.empresa_cif}</span>
                      )}
                    </div>
                  </div>

                  {proformaSeleccionada.notas && (
                    <div className="proforma-notas-row">
                      <StickyNote />
                      <div className="proforma-notas-content">
                        <span className="proforma-notas-label">Notas</span>
                        <span className="proforma-notas-text">{proformaSeleccionada.notas}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabla de conceptos */}
                <div className="proforma-conceptos-section">
                  <div className="proforma-conceptos-header">
                    <ClipboardList />
                    Conceptos / Productos
                  </div>
                  {proformaSeleccionada.detalles && proformaSeleccionada.detalles.length > 0 ? (
                    <div className="proforma-tabla-container">
                      <table className="proforma-tabla">
                        <thead>
                          <tr>
                            <th>Descripción</th>
                            <th>Vehículo</th>
                            <th>Cant.</th>
                            <th>P. Unit.</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {proformaSeleccionada.detalles.map((detalle, index) => (
                            <tr key={index}>
                              <td>
                                <span className="proforma-tabla-descripcion">{detalle.descripcion || 'Sin descripción'}</span>
                              </td>
                              <td>
                                {detalle.matricula ? (
                                  <>
                                    <span className="proforma-tabla-vehiculo">{detalle.marca} {detalle.modelo}</span>
                                    <br />
                                    <span className="proforma-tabla-vehiculo-matricula">{detalle.matricula}</span>
                                  </>
                                ) : (
                                  <span style={{ color: '#9ca3af' }}>—</span>
                                )}
                              </td>
                              <td className="proforma-tabla-cantidad">{detalle.cantidad || 1}</td>
                              <td className="proforma-tabla-precio">€{(detalle.precio_unitario || detalle.precio || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                              <td className="proforma-tabla-total">€{(detalle.total || (detalle.precio || 0) * (detalle.cantidad || 1)).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="proforma-tabla-empty">No hay productos en esta proforma</div>
                  )}
                </div>

                {/* Totales inline compactos */}
                <div className="proforma-totales-container">
                  <div className="proforma-totales-box">
                    <div className="proforma-totales-item">
                      <span className="proforma-totales-label">Subtotal:</span>
                      <span className="proforma-totales-value">€{(proformaSeleccionada.subtotal || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="proforma-totales-divider"></div>
                    <div className="proforma-totales-item">
                      <span className="proforma-totales-label">IGIC:</span>
                      <span className="proforma-totales-value">€{(proformaSeleccionada.igic || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="proforma-totales-item proforma-totales-total">
                      <span className="proforma-totales-label">Total:</span>
                      <span className="proforma-totales-value">€{(proformaSeleccionada.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="proforma-modal-footer">
                  <button 
                    className="proforma-btn proforma-btn-outline"
                    onClick={() => setMostrarDialogProforma(false)}
                  >
                    Cerrar
                  </button>
                  <button 
                    className="proforma-btn proforma-btn-primary"
                    onClick={() => {
                      onNavigate('proformas');
                      setMostrarDialogProforma(false);
                    }}
                  >
                    <FileText />
                    Ir a Proformas
                  </button>
                </div>
              </div>
            ) : (
              <div className="proforma-not-found">No se encontró información de la proforma.</div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CochesErrorBoundary>
  );
}


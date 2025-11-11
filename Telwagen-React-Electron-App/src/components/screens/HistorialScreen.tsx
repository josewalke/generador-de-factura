import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../ui/pagination';
import { Eye } from 'lucide-react';
import { Screen } from '../../App';
import { facturaPDFService } from '../../services/facturaPDFService';
import { reporteService } from '../../services/reporteService';
import { facturaService, Factura } from '../../services/facturaService';

interface HistorialScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function HistorialScreen({ onNavigate }: HistorialScreenProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('todos');
  const [filtroEmpresa, setFiltroEmpresa] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [vistaActual, setVistaActual] = useState<'tabla' | 'tarjetas'>('tabla');
  const [paginaActual, setPaginaActual] = useState(1);
  const [facturaDetalle, setFacturaDetalle] = useState<Factura | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPorPagina = 10;

  // Cargar facturas directamente desde el servicio
  const cargarFacturas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await facturaService.getAllWithProducts(paginaActual, itemsPorPagina, {
        search: busqueda,
        empresa_id: filtroEmpresa !== 'todos' ? filtroEmpresa : undefined,
        cliente_id: filtroCliente !== 'todos' ? filtroCliente : undefined
      });
      setFacturas(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar facturas');
      console.error('Error fetching facturas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFacturas();
  }, [paginaActual, busqueda, filtroEmpresa, filtroCliente]);

  // Usar datos reales
  const facturasParaMostrar = facturas || [];
  
  const facturasFiltradas = facturasParaMostrar.filter(factura => {
    const matchesBusqueda = 
      (factura.numero || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (factura.cliente || '').toLowerCase().includes(busqueda.toLowerCase());
    
    const matchesCliente = filtroCliente === 'todos' || factura.cliente === filtroCliente;
    const matchesEmpresa = filtroEmpresa === 'todos' || factura.empresa === filtroEmpresa;
    const matchesEstado = filtroEstado === 'todos' || factura.estado === filtroEstado;
    
    return matchesBusqueda && matchesCliente && matchesEmpresa && matchesEstado;
  });

  const totalPaginas = Math.ceil(facturasFiltradas.length / itemsPorPagina);
  const facturasPaginadas = facturasFiltradas.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina
  );

  const stats = {
    totalFacturas: facturasParaMostrar.length,
    ingresosMes: facturasParaMostrar
      .filter(f => f.fecha && new Date(f.fecha).getMonth() === new Date().getMonth())
      .reduce((sum, f) => sum + (f.total || 0), 0),
    pagadas: facturasParaMostrar.filter(f => f.estado === 'pagada').length,
    pendientes: facturasParaMostrar.filter(f => f.estado === 'pendiente').length,
    vencidas: facturasParaMostrar.filter(f => f.estado === 'vencida').length
  };

  const clientesUnicos = [...new Set(facturasParaMostrar.map(f => f.cliente))];
  const empresasUnicas = [...new Set(facturasParaMostrar.map(f => f.empresa))];

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pagada':
        return <Badge className="bg-green-100 text-green-800">Pagada</Badge>;
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'vencida':
        return <Badge className="bg-red-100 text-red-800">Vencida</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const handleDescargarPDF = async (factura: Factura) => {
    try {
      console.log('📄 [HistorialScreen] Descargando PDF para factura:', factura.numero);
      
      const facturaData = {
        numero: factura.numero,
        fecha: factura.fecha,
        cliente: factura.cliente,
        empresa: factura.empresa,
        subtotal: factura.subtotal,
        impuesto: factura.impuesto,
        total: factura.total,
        estado: factura.estado,
        productos: factura.productos
      };
      
      await facturaPDFService.generarPDFFactura(facturaData);
      
      console.log('📄 [HistorialScreen] PDF descargado exitosamente');
    } catch (error) {
      console.error('📄 [HistorialScreen] Error al descargar PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtelo de nuevo.');
    }
  };

  const handleReporteMensual = async () => {
    try {
      console.log('📊 [HistorialScreen] Generando reporte mensual...');
      
      await reporteService.generarReporteMensualPDF(facturasParaMostrar);
      
      console.log('📊 [HistorialScreen] Reporte mensual generado exitosamente');
    } catch (error) {
      console.error('📊 [HistorialScreen] Error al generar reporte mensual:', error);
      alert('Error al generar el reporte mensual. Por favor, inténtelo de nuevo.');
    }
  };

  const handleExportarExcel = async () => {
    try {
      console.log('📥 [HistorialScreen] Exportando facturas a Excel...');
      
      await reporteService.exportarFacturasExcel(facturasParaMostrar);
      
      console.log('📥 [HistorialScreen] Excel exportado exitosamente');
    } catch (error) {
      console.error('📥 [HistorialScreen] Error al exportar Excel:', error);
      alert('Error al exportar a Excel. Por favor, inténtelo de nuevo.');
    }
  };

  // Mostrar estado de carga o error
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando facturas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar facturas</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => cargarFacturas()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
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
                <span>🏠</span>
                <span>Home</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <span className="text-2xl">📊</span>
                  <span>Historial de Facturas</span>
                </h1>
                <p className="text-gray-600">Registro de todas las facturas generadas</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <span className="text-2xl">📄</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Facturas</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalFacturas}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ingresos del Mes</p>
                      <p className="text-xl font-bold text-green-600">€{(stats.ingresosMes || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros y Lista */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-lg">🔍</span>
                    <span>Historial de Facturas</span>
                  </CardTitle>
                  <Tabs value={vistaActual} onValueChange={(value) => setVistaActual(value as 'tabla' | 'tarjetas')}>
                    <TabsList>
                      <TabsTrigger value="tabla">📊 Tabla</TabsTrigger>
                      <TabsTrigger value="tarjetas">🃏 Tarjetas</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Input
                    placeholder="Buscar por número o cliente..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />

                  <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
                    <SelectTrigger>
                      <SelectValue placeholder="Empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las Empresas</SelectItem>
                      {empresasUnicas.map(empresa => (
                        <SelectItem key={empresa} value={empresa}>{empresa}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs value={vistaActual}>
                  <TabsContent value="tabla" className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-2 py-2 text-sm">Número</TableHead>
                          <TableHead className="px-2 py-2 text-sm">Fecha</TableHead>
                          <TableHead className="px-2 py-2 text-sm">Cliente</TableHead>
                          <TableHead className="px-2 py-2 text-sm text-right">Subtotal</TableHead>
                          <TableHead className="px-2 py-2 text-sm text-right">Impuesto</TableHead>
                          <TableHead className="px-2 py-2 text-sm text-right">Total</TableHead>
                          <TableHead className="px-2 py-2 text-sm text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {facturasPaginadas.map(factura => (
                          <TableRow key={factura.id} className="align-top">
                            <TableCell className="px-2 py-2 whitespace-nowrap">
                              <p className="font-semibold text-sm">{factura.numero}</p>
                            </TableCell>
                            <TableCell className="px-2 py-2 whitespace-nowrap">
                              <p className="text-sm">{new Date(factura.fecha).toLocaleDateString()}</p>
                            </TableCell>
                            <TableCell className="px-2 py-2 break-words">
                              <div className="font-medium leading-tight text-sm">
                                {factura.cliente}
                              </div>
                              <div className="text-muted-foreground text-xs leading-tight">
                                {factura.empresa}
                              </div>
                            </TableCell>
                            <TableCell className="px-2 py-2 text-right whitespace-nowrap">
                              <p className="text-sm">€{(factura.subtotal || 0).toLocaleString()}</p>
                            </TableCell>
                            <TableCell className="px-2 py-2 text-right whitespace-nowrap">
                              <p className="text-sm">€{(factura.impuesto || 0).toLocaleString()}</p>
                            </TableCell>
                            <TableCell className="px-2 py-2 text-right font-semibold text-emerald-600 whitespace-nowrap">
                              <p className="text-sm">€{(factura.total || 0).toLocaleString()}</p>
                            </TableCell>
                            <TableCell className="px-2 py-2 text-center">
                              <div className="inline-flex gap-1">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="w-8 h-8 p-0"
                                      onClick={() => setFacturaDetalle(factura)}
                                    >
                                      <Eye className="size-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Detalle de Factura {factura.numero}</DialogTitle>
                                      <DialogDescription>
                                        Ver la información completa y detalle de productos de la factura seleccionada.
                                      </DialogDescription>
                                    </DialogHeader>
                                    {facturaDetalle && (
                                      <DetalleFactura 
                                        factura={facturaDetalle} 
                                        onDescargarPDF={handleDescargarPDF}
                                      />
                                    )}
                                  </DialogContent>
                                </Dialog>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-8 h-8 p-0"
                                  onClick={() => handleDescargarPDF(factura)}
                                >
                                  📥
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Paginación */}
                    <div className="flex justify-center mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                              className={paginaActual === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          
                          {[...Array(totalPaginas)].map((_, i) => (
                            <PaginationItem key={i + 1}>
                              <PaginationLink
                                onClick={() => setPaginaActual(i + 1)}
                                isActive={paginaActual === i + 1}
                                className="cursor-pointer"
                              >
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                              className={paginaActual === totalPaginas ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tarjetas" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {facturasPaginadas.map(factura => (
                        <Card key={factura.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{factura.numero}</h3>
                                <p className="text-sm text-gray-500">{new Date(factura.fecha).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="font-medium">{factura.cliente}</p>
                              <p className="text-sm text-gray-500">{factura.empresa}</p>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500">Subtotal</p>
                                <p>€{(factura.subtotal || 0).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">IGIC</p>
                                <p>€{(factura.impuesto || 0).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Total</p>
                                <p className="font-semibold text-green-600">€{(factura.total || 0).toLocaleString()}</p>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2 pt-2">
                              <Button variant="outline" size="sm" className="flex-1">
                                👁️ Ver
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDescargarPDF(factura)}
                              >
                                📥
                              </Button>
                              <Button variant="outline" size="sm">
                                📧
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resumen del Mes */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-lg">📅</span>
                  <span>Resumen del Mes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Facturas:</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ingresos:</span>
                  <span className="font-semibold text-green-600">€{(stats.ingresosMes || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Promedio:</span>
                  <span className="font-semibold">€{Math.round((stats.ingresosMes || 0) / 8).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-lg">⚡</span>
                  <span>Acciones Rápidas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onNavigate('facturas')}
                >
                  <span className="mr-2">➕</span>
                  Nueva Factura
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleReporteMensual}
                >
                  <span className="mr-2">📊</span>
                  Reporte Mensual
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleExportarExcel}
                >
                  <span className="mr-2">📥</span>
                  Exportar Excel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DetalleFacturaProps {
  factura: Factura;
  onDescargarPDF: (factura: Factura) => void;
}

function DetalleFactura({ factura, onDescargarPDF }: DetalleFacturaProps) {
  // Función para obtener datos del coche directamente desde los campos del producto
  const obtenerDatosCoche = (producto: any) => {
    return {
      marca: producto.marca || '',
      modelo: producto.modelo || '',
      matricula: producto.matricula || '',
      color: producto.color || '',
      kilometros: producto.kilometros || '',
      chasis: producto.chasis || '',
      descripcionOriginal: producto.descripcion || ''
    };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Información de la Factura</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Número:</span> {factura.numero}</p>
            <p><span className="font-medium">Fecha:</span> {new Date(factura.fecha).toLocaleDateString()}</p>
            <p><span className="font-medium">Estado:</span> {factura.estado}</p>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Cliente</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Nombre:</span> {factura.cliente}</p>
            <p><span className="font-medium">Empresa:</span> {factura.empresa}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Productos</h3>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Marca</TableHead>
                <TableHead className="whitespace-nowrap">Modelo</TableHead>
                <TableHead className="whitespace-nowrap">Matrícula</TableHead>
                <TableHead className="whitespace-nowrap text-center">Cantidad</TableHead>
                <TableHead className="whitespace-nowrap text-right">Precio</TableHead>
              </TableRow>
            </TableHeader>
        <TableBody>
          {factura.productos.map((producto, index) => {
            const datosCoche = obtenerDatosCoche(producto);
            return (
              <TableRow key={index}>
                <TableCell className="whitespace-nowrap text-sm">
                  {datosCoche.marca || 'N/A'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {datosCoche.modelo || 'N/A'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {datosCoche.matricula || 'N/A'}
                </TableCell>
                <TableCell className="text-center text-sm">{producto.cantidad}</TableCell>
                <TableCell className="text-right text-sm">€{(producto.precio || 0).toLocaleString()}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>€{(factura.subtotal || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>IGIC (9.5%):</span>
            <span>€{(factura.impuesto || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span className="text-green-600">€{(factura.total || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

       <div className="flex justify-center">
         <Button 
           className="w-full max-w-xs"
           onClick={() => onDescargarPDF(factura)}
         >
           📥 Descargar PDF
         </Button>
       </div>
    </div>
  );
}

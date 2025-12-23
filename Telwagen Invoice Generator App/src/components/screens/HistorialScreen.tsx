import React, { useState } from 'react';
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

interface HistorialScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface Factura {
  id: string;
  numero: string;
  fecha: string;
  cliente: string;
  empresa: string;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: 'pagada' | 'pendiente' | 'vencida';
  productos: Array<{
    descripcion: string;
    cantidad: number;
    precio: number;
  }>;
}

export function HistorialScreen({ onNavigate }: HistorialScreenProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('todos');
  const [filtroEmpresa, setFiltroEmpresa] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [vistaActual, setVistaActual] = useState<'tabla' | 'tarjetas'>('tabla');
  const [paginaActual, setPaginaActual] = useState(1);
  const [facturaDetalle, setFacturaDetalle] = useState<Factura | null>(null);

  const itemsPorPagina = 10;

  // Mock data
  const facturas: Factura[] = [
    {
      id: '1',
      numero: 'C001/2024',
      fecha: '2024-03-15',
      cliente: 'Juan Pérez García',
      empresa: 'Telwagen Car Ibérica, S.L.',
      subtotal: 28500,
      impuesto: 2707.5,
      total: 31207.5,
      estado: 'pagada',
      productos: [
        { descripcion: 'Nissan Qashqai 2024', cantidad: 1, precio: 28500 }
      ]
    },
    {
      id: '2',
      numero: 'C002/2024',
      fecha: '2024-03-18',
      cliente: 'María López Rodríguez',
      empresa: 'Telwagen Car Ibérica, S.L.',
      subtotal: 35200,
      impuesto: 3344,
      total: 38544,
      estado: 'pagada',
      productos: [
        { descripcion: 'Nissan X-Trail 2024', cantidad: 1, precio: 35200 }
      ]
    },
    {
      id: '3',
      numero: 'C003/2024',
      fecha: '2024-03-20',
      cliente: 'Carlos Mendoza Silva',
      empresa: 'Telwagen Tenerife Norte',
      subtotal: 18900,
      impuesto: 1795.5,
      total: 20695.5,
      estado: 'pendiente',
      productos: [
        { descripcion: 'Nissan Micra 2023', cantidad: 1, precio: 18900 }
      ]
    },
    {
      id: '4',
      numero: 'C004/2024',
      fecha: '2024-03-22',
      cliente: 'Ana Fernández Torres',
      empresa: 'Telwagen Car Ibérica, S.L.',
      subtotal: 32000,
      impuesto: 3040,
      total: 35040,
      estado: 'pagada',
      productos: [
        { descripción: 'Nissan Leaf 2024', cantidad: 1, precio: 32000 }
      ]
    },
    {
      id: '5',
      numero: 'C005/2024',
      fecha: '2024-02-28',
      cliente: 'Pedro Sánchez Martín',
      empresa: 'Telwagen Car Ibérica, S.L.',
      subtotal: 25400,
      impuesto: 2413,
      total: 27813,
      estado: 'vencida',
      productos: [
        { descripcion: 'Nissan Juke 2024', cantidad: 1, precio: 25400 }
      ]
    }
  ];

  const facturasFiltradas = facturas.filter(factura => {
    const matchesBusqueda = 
      factura.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      factura.cliente.toLowerCase().includes(busqueda.toLowerCase());
    
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
    totalFacturas: facturas.length,
    ingresosMes: facturas
      .filter(f => new Date(f.fecha).getMonth() === new Date().getMonth())
      .reduce((sum, f) => sum + f.total, 0),
    pagadas: facturas.filter(f => f.estado === 'pagada').length,
    pendientes: facturas.filter(f => f.estado === 'pendiente').length,
    vencidas: facturas.filter(f => f.estado === 'vencida').length
  };

  const clientesUnicos = [...new Set(facturas.map(f => f.cliente))];
  const empresasUnicas = [...new Set(facturas.map(f => f.empresa))];

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
                      <p className="text-xl font-bold text-green-600">€{stats.ingresosMes.toLocaleString()}</p>
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
                          <TableHead>Número</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead>Impuesto</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {facturasPaginadas.map(factura => (
                          <TableRow key={factura.id}>
                            <TableCell>
                              <p className="font-semibold">{factura.numero}</p>
                            </TableCell>
                            <TableCell>
                              <p>{new Date(factura.fecha).toLocaleDateString()}</p>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{factura.cliente}</p>
                                <p className="text-sm text-gray-500">{factura.empresa}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p>€{factura.subtotal.toLocaleString()}</p>
                            </TableCell>
                            <TableCell>
                              <p>€{factura.impuesto.toLocaleString()}</p>
                            </TableCell>
                            <TableCell>
                              <p className="font-semibold text-green-600">€{factura.total.toLocaleString()}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setFacturaDetalle(factura)}
                                    >
                                      <Eye className="size-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Detalle de Factura {factura.numero}</DialogTitle>
                                      <DialogDescription>
                                        Ver la información completa y detalle de productos de la factura seleccionada.
                                      </DialogDescription>
                                    </DialogHeader>
                                    {facturaDetalle && (
                                      <DetalleFactura factura={facturaDetalle} />
                                    )}
                                  </DialogContent>
                                </Dialog>
                                <Button variant="outline" size="sm">
                                  📥
                                </Button>
                                <Button variant="outline" size="sm">
                                  📧
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
                                <p>€{factura.subtotal.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">IGIC</p>
                                <p>€{factura.impuesto.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Total</p>
                                <p className="font-semibold text-green-600">€{factura.total.toLocaleString()}</p>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2 pt-2">
                              <Button variant="outline" size="sm" className="flex-1">
                                👁️ Ver
                              </Button>
                              <Button variant="outline" size="sm">
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
                  <span className="font-semibold text-green-600">€{stats.ingresosMes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Promedio:</span>
                  <span className="font-semibold">€{Math.round(stats.ingresosMes / 8).toLocaleString()}</span>
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
                >
                  <span className="mr-2">📊</span>
                  Reporte Mensual
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <span className="mr-2">📥</span>
                  Exportar Excel
                </Button>
              </CardContent>
            </Card>

            {/* Filtros Rápidos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-lg">🔧</span>
                  <span>Filtros Rápidos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setFiltroEstado('pendiente')}
                >
                  Facturas Pendientes
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setFiltroEstado('vencida')}
                >
                  Facturas Vencidas
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  Este Mes
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  Último Trimestre
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
}

function DetalleFactura({ factura }: DetalleFacturaProps) {
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Precio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {factura.productos.map((producto, index) => (
              <TableRow key={index}>
                <TableCell>{producto.descripcion}</TableCell>
                <TableCell>{producto.cantidad}</TableCell>
                <TableCell>€{producto.precio.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>€{factura.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>IGIC (9.5%):</span>
            <span>€{factura.impuesto.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span className="text-green-600">€{factura.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button className="flex-1">
          📥 Descargar PDF
        </Button>
        <Button variant="outline" className="flex-1">
          📧 Enviar por Email
        </Button>
      </div>
    </div>
  );
}
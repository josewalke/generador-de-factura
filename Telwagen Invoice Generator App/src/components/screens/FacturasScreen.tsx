import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Screen } from '../../App';

interface FacturasScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  direccion: string;
  cif: string;
}

interface Coche {
  id: string;
  marca: string;
  modelo: string;
  año: number;
  precio: number;
  estado: 'disponible' | 'vendido';
}

interface ProductoFactura {
  id: string;
  descripcion: string;
  cantidad: number;
  precio: number;
  impuesto: number;
  total: number;
}

export function FacturasScreen({ onNavigate }: FacturasScreenProps) {
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [cocheSeleccionado, setCocheSeleccionado] = useState<Coche | null>(null);
  const [productos, setProductos] = useState<ProductoFactura[]>([]);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  
  // Mock data
  const clientes: Cliente[] = [
    { id: '1', nombre: 'Juan Pérez García', email: 'juan@email.com', direccion: 'Calle Principal 123, Las Palmas', cif: '12345678A' },
    { id: '2', nombre: 'María López Rodríguez', email: 'maria@email.com', direccion: 'Avenida Central 456, Tenerife', cif: '87654321B' },
    { id: '3', nombre: 'Carlos Mendoza Silva', email: 'carlos@email.com', direccion: 'Plaza Mayor 789, Gran Canaria', cif: '11223344C' }
  ];

  const coches: Coche[] = [
    { id: '1', marca: 'Nissan', modelo: 'Qashqai', año: 2024, precio: 28500, estado: 'disponible' },
    { id: '2', marca: 'Nissan', modelo: 'X-Trail', año: 2024, precio: 35200, estado: 'disponible' },
    { id: '3', marca: 'Nissan', modelo: 'Micra', año: 2023, precio: 18900, estado: 'disponible' }
  ];

  const empresaData = {
    nombre: 'Telwagen Car Ibérica, S.L.',
    cif: 'B-93.289.585',
    direccion: 'Polígono Industrial de Arinaga, Las Palmas',
    telefono: '+34 928 123 456',
    email: 'info@telwagen.com'
  };

  // Filtrar clientes basado en la búsqueda
  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    cliente.cif.toLowerCase().includes(busquedaCliente.toLowerCase())
  );

  const seleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente(cliente.nombre);
    setDropdownAbierto(false);
  };

  const handleInputChange = (value: string) => {
    setBusquedaCliente(value);
    setDropdownAbierto(value.length > 0);
    
    // Si el input está vacío, limpiar la selección
    if (value === '') {
      setClienteSeleccionado(null);
    }
    
    // Si no coincide exactamente con el cliente seleccionado, limpiar la selección
    if (clienteSeleccionado && value !== clienteSeleccionado.nombre) {
      setClienteSeleccionado(null);
    }
  };

  const agregarProducto = () => {
    if (!cocheSeleccionado) return;
    
    const impuesto = cocheSeleccionado.precio * 0.095; // IGIC 9.5%
    const total = cocheSeleccionado.precio + impuesto;
    
    const nuevoProducto: ProductoFactura = {
      id: Date.now().toString(),
      descripcion: `${cocheSeleccionado.marca} ${cocheSeleccionado.modelo} ${cocheSeleccionado.año}`,
      cantidad: 1,
      precio: cocheSeleccionado.precio,
      impuesto: impuesto,
      total: total
    };
    
    setProductos([...productos, nuevoProducto]);
    setCocheSeleccionado(null);
  };

  const eliminarProducto = (id: string) => {
    setProductos(productos.filter(p => p.id !== id));
  };

  const calcularTotales = () => {
    const subtotal = productos.reduce((sum, p) => sum + p.precio, 0);
    const totalImpuestos = productos.reduce((sum, p) => sum + p.impuesto, 0);
    const total = subtotal + totalImpuestos;
    return { subtotal, totalImpuestos, total };
  };

  const { subtotal, totalImpuestos, total } = calcularTotales();

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
                <h1 className="text-2xl font-bold text-gray-900">Generar Factura</h1>
                <p className="text-gray-600">Nueva factura de venta</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos de la Empresa */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-lg">🏢</span>
                    <span>Datos de la Empresa</span>
                  </CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <span>🔄</span>
                        <span>Cambiar</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Seleccionar Empresa</DialogTitle>
                        <DialogDescription>
                          Elige la empresa que emitirá esta factura.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid gap-4">
                          <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer border-blue-500 bg-blue-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">Telwagen Car Ibérica, S.L.</p>
                                <p className="text-sm text-gray-600">CIF: B-93.289.585</p>
                                <p className="text-sm text-gray-600">Polígono Industrial de Arinaga, Las Palmas</p>
                              </div>
                              <Badge className="bg-blue-100 text-blue-700">Actual</Badge>
                            </div>
                          </div>
                          
                          <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">Telwagen Tenerife Norte</p>
                                <p className="text-sm text-gray-600">CIF: B-84.321.678</p>
                                <p className="text-sm text-gray-600">Avenida Tres de Mayo, Santa Cruz de Tenerife</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">Telwagen Gran Canaria Sur</p>
                                <p className="text-sm text-gray-600">CIF: B-92.456.789</p>
                                <p className="text-sm text-gray-600">Zona Comercial Maspalomas, Las Palmas</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2 pt-4">
                          <Button variant="outline" size="sm">
                            Cancelar
                          </Button>
                          <Button size="sm">
                            Seleccionar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">{empresaData.nombre}</p>
                <p className="text-gray-600">CIF: {empresaData.cif}</p>
                <p className="text-gray-600">{empresaData.direccion}</p>
                <p className="text-gray-600">{empresaData.telefono} | {empresaData.email}</p>
              </CardContent>
            </Card>

            {/* Datos del Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-lg">👤</span>
                  <span>Datos del Cliente</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Label htmlFor="cliente">Buscar Cliente</Label>
                  <div className="relative">
                    <Input
                      id="cliente"
                      placeholder="Escribe el nombre o CIF del cliente..."
                      value={busquedaCliente}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onFocus={() => setDropdownAbierto(busquedaCliente.length > 0)}
                      onBlur={() => {
                        // Retrasar el cierre para permitir la selección
                        setTimeout(() => setDropdownAbierto(false), 200);
                      }}
                    />
                    
                    {/* Dropdown con sugerencias */}
                    {dropdownAbierto && clientesFiltrados.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {clientesFiltrados.map((cliente) => (
                          <div
                            key={cliente.id}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => seleccionarCliente(cliente)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{cliente.nombre}</p>
                                <p className="text-sm text-gray-500">CIF: {cliente.cif}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-400">{cliente.email}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Mensaje cuando no hay resultados */}
                    {dropdownAbierto && busquedaCliente.length > 0 && clientesFiltrados.length === 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                        <div className="px-4 py-3 text-gray-500 text-center">
                          No se encontraron clientes que coincidan con "{busquedaCliente}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {clienteSeleccionado && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-semibold">{clienteSeleccionado.nombre}</p>
                    <p className="text-gray-600">CIF: {clienteSeleccionado.cif}</p>
                    <p className="text-gray-600">{clienteSeleccionado.direccion}</p>
                    <p className="text-gray-600">{clienteSeleccionado.email}</p>
                  </div>
                )}

                <Button variant="outline" className="w-full">
                  <span className="mr-2">➕</span>
                  Nuevo Cliente
                </Button>
              </CardContent>
            </Card>

            {/* Selección de Coches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-lg">🚗</span>
                  <span>Seleccionar Vehículo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Todos los Vehículos</Label>
                  <div className="space-y-2 mt-2">
                    {coches.map(coche => (
                      <div
                        key={coche.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                          coche.estado === 'disponible' 
                            ? 'border-gray-200 hover:border-blue-300' 
                            : 'border-gray-200 opacity-60'
                        }`}
                        onClick={() => {
                          if (coche.estado === 'disponible') {
                            setCocheSeleccionado(coche);
                            agregarProducto();
                          }
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {coche.marca} {coche.modelo}
                              </h4>
                              <p className="text-sm text-gray-500">Año {coche.año}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <p className="font-semibold text-green-600">
                                €{coche.precio.toLocaleString()}
                              </p>
                            </div>
                            
                            <Badge 
                              variant="secondary" 
                              className={`${
                                coche.estado === 'disponible' 
                                  ? 'bg-green-100 text-green-700'
                                  : coche.estado === 'vendido'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {coche.estado === 'disponible' ? 'Disponible' : 
                               coche.estado === 'vendido' ? 'Vendido' : 
                               coche.estado.charAt(0).toUpperCase() + coche.estado.slice(1)}
                            </Badge>
                            
                            {coche.estado === 'disponible' && (
                              <div className="text-blue-600">
                                <span className="text-sm">➕ Click para agregar</span>
                              </div>
                            )}
                            
                            {coche.estado !== 'disponible' && (
                              <div className="text-gray-400">
                                <span className="text-sm">No disponible</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {coches.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl mb-2 block">🚗</span>
                    <p>No hay vehículos registrados</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Productos en la Factura */}
            {productos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-lg">📋</span>
                    <span>Productos en la Factura</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Configuración de Impuestos */}
                    <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Label className="text-sm font-medium">Tipo de impuesto:</Label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="tax-type"
                              value="igic"
                              defaultChecked
                              className="text-blue-600"
                              onChange={() => {
                                // Cambiar a IGIC 9.5% y recalcular automáticamente
                                console.log('Cambio a IGIC 9.5%');
                              }}
                            />
                            <span className="text-sm">IGIC</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="tax-type"
                              value="iva"
                              className="text-blue-600"
                              onChange={() => {
                                // Cambiar a IVA 21% y recalcular automáticamente
                                console.log('Cambio a IVA 21%');
                              }}
                            />
                            <span className="text-sm">IVA</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="tax-rate" className="text-sm font-medium">
                          Porcentaje:
                        </Label>
                        <Input
                          id="tax-rate"
                          type="number"
                          value={9.5}
                          readOnly
                          className="w-16 text-center bg-gray-100"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>IGIC</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productos.map(producto => (
                          <TableRow key={producto.id}>
                            <TableCell>{producto.descripcion}</TableCell>
                            <TableCell>{producto.cantidad}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={producto.precio}
                                onChange={(e) => {
                                  const nuevoPrecio = parseFloat(e.target.value) || 0;
                                  // Recalcular automáticamente al cambiar precio
                                  console.log('Nuevo precio:', nuevoPrecio);
                                }}
                                className="w-24 text-right"
                                min="0"
                                step="0.01"
                              />
                            </TableCell>
                            <TableCell>€{producto.impuesto.toLocaleString()}</TableCell>
                            <TableCell className="font-semibold">€{producto.total.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => eliminarProducto(producto.id)}
                              >
                                🗑️
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Totales y Acciones */}
          <div className="space-y-6">
            {/* Totales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-lg">💰</span>
                  <span>Totales</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>€{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IGIC (9.5%):</span>
                  <span>€{totalImpuestos.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-blue-600">€{total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-lg">⚡</span>
                  <span>Acciones</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      disabled={!clienteSeleccionado || productos.length === 0}
                    >
                      <span className="mr-2">👁️</span>
                      Vista Previa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Vista Previa de Factura</DialogTitle>
                      <DialogDescription>
                        Revisa los detalles de la factura antes de generarla.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="bg-white p-8 border rounded-lg">
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-blue-900">FACTURA</h2>
                        <p className="text-gray-600">Nº C001/2024</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                          <h3 className="font-bold mb-2">EMISOR</h3>
                          <p className="font-semibold">{empresaData.nombre}</p>
                          <p>CIF: {empresaData.cif}</p>
                          <p>{empresaData.direccion}</p>
                        </div>
                        {clienteSeleccionado && (
                          <div>
                            <h3 className="font-bold mb-2">CLIENTE</h3>
                            <p className="font-semibold">{clienteSeleccionado.nombre}</p>
                            <p>CIF: {clienteSeleccionado.cif}</p>
                            <p>{clienteSeleccionado.direccion}</p>
                          </div>
                        )}
                      </div>

                      <Table className="mb-8">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead>IGIC</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productos.map(producto => (
                            <TableRow key={producto.id}>
                              <TableCell>{producto.descripcion}</TableCell>
                              <TableCell>{producto.cantidad}</TableCell>
                              <TableCell>€{producto.precio.toLocaleString()}</TableCell>
                              <TableCell>€{producto.impuesto.toLocaleString()}</TableCell>
                              <TableCell>€{producto.total.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <div className="text-right">
                        <p>Subtotal: €{subtotal.toLocaleString()}</p>
                        <p>IGIC (9.5%): €{totalImpuestos.toLocaleString()}</p>
                        <p className="text-xl font-bold">Total: €{total.toLocaleString()}</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  disabled={!clienteSeleccionado || productos.length === 0}
                >
                  <span className="mr-2">📄</span>
                  Generar Factura
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={!clienteSeleccionado || productos.length === 0}
                >
                  <span className="mr-2">📥</span>
                  Descargar PDF
                </Button>
              </CardContent>
            </Card>

            {/* Info */}
            <Card className="bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-lg">ℹ️</span>
                  <span>Información</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Las facturas se numeran automáticamente siguiendo el formato C001/2024.
                  Se aplica IGIC del 9.5% por defecto para Canarias.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
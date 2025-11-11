import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Screen } from '../../App';
import { useClientes } from '../../hooks/useClientes';
import { useCoches } from '../../hooks/useCoches';
import { useEmpresas } from '../../hooks/useEmpresas';
import { Cliente } from '../../services/clienteService';
import { Coche } from '../../services/cocheService';
import { Empresa } from '../../services/empresaService';
import { facturaService, SiguienteNumeroResponse } from '../../services/facturaService';
import { facturaPDFService, FacturaPDFData } from '../../services/facturaPDFService';
import { toast } from 'sonner';

interface FacturasScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface ProductoFactura {
  id: string;
  descripcion: string;
  cantidad: number;
  precio: number;
  impuesto: number;
  total: number;
}

type TipoImpuesto = 'igic' | 'iva';

interface ConfiguracionImpuesto {
  tipo: TipoImpuesto;
  porcentaje: number;
  nombre: string;
}

export function FacturasScreen({ onNavigate }: FacturasScreenProps) {
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
  const [productos, setProductos] = useState<ProductoFactura[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [mostrarModalEmpresa, setMostrarModalEmpresa] = useState(false);
  const [tipoImpuesto, setTipoImpuesto] = useState<TipoImpuesto>('igic');
  const [facturaGenerada, setFacturaGenerada] = useState<any>(null);
  const [generandoFactura, setGenerandoFactura] = useState(false);
  
  // Hooks para obtener datos reales
  const { clientes } = useClientes();
  const { coches, loading } = useCoches();
  const { empresas } = useEmpresas();

  // Configuración de impuestos
  const configuracionImpuestos: Record<TipoImpuesto, ConfiguracionImpuesto> = {
    igic: { tipo: 'igic', porcentaje: 9.5, nombre: 'IGIC' },
    iva: { tipo: 'iva', porcentaje: 21, nombre: 'IVA' }
  };

  const impuestoActual = configuracionImpuestos[tipoImpuesto];

  // Seleccionar la primera empresa por defecto
  useEffect(() => {
    if (empresas.length > 0 && !empresaSeleccionada) {
      setEmpresaSeleccionada(empresas[0]);
    }
  }, [empresas, empresaSeleccionada]);

  // Filtrar clientes basado en la búsqueda (memoizado)
  const clientesFiltrados = useMemo(() => 
    clientes.filter(cliente =>
      cliente.nombre?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
      cliente.identificacion?.toLowerCase().includes(busquedaCliente.toLowerCase())
    ), [clientes, busquedaCliente]
  );

  // Filtrar coches disponibles (excluir los ya agregados a la factura)
  const cochesDisponibles = useMemo(() => {
    // Obtener las matrículas de los coches ya agregados a la factura
    const matriculasAgregadas = productos.map(producto => {
      // Extraer la matrícula del texto de descripción
      const match = producto.descripcion.match(/Matrícula: ([A-Z0-9-]+)/);
      return match ? match[1] : null;
    }).filter(Boolean);

    // Filtrar coches que no estén ya en la factura
    return coches.filter(coche => 
      !matriculasAgregadas.includes(coche.matricula) && !coche.vendido
    );
  }, [coches, productos]);

  const seleccionarCliente = useCallback((cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente(cliente.nombre || '');
    setDropdownAbierto(false);
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setBusquedaCliente(value);
    setDropdownAbierto(value.length > 0);
    
    // Si el input está vacío, limpiar la selección
    if (value === '') {
      setClienteSeleccionado(null);
    }
    
    // Si no coincide exactamente con el cliente seleccionado, limpiar la selección
    if (clienteSeleccionado && value !== (clienteSeleccionado.nombre || '')) {
      setClienteSeleccionado(null);
    }
  }, [clienteSeleccionado]);

  // Función para recalcular impuestos de un producto
  const recalcularProducto = useCallback((precio: number, cantidad: number = 1): { impuesto: number; total: number } => {
    const subtotal = precio * cantidad;
    const impuesto = subtotal * (impuestoActual.porcentaje / 100);
    const total = subtotal + impuesto;
    return { impuesto, total };
  }, [impuestoActual.porcentaje]);

  const agregarProducto = useCallback((coche: Coche) => {
    // Verificar si el coche ya está en la factura
    const yaExiste = productos.some(producto => 
      producto.descripcion.includes(coche.matricula)
    );
    
    if (yaExiste) {
      toast.warning('Este vehículo ya está en la factura');
      return;
    }
    
    const precio = coche.precio || 0;
    const { impuesto, total } = recalcularProducto(precio);
    
    const nuevoProducto: ProductoFactura = {
      id: Date.now().toString(),
      descripcion: `${coche.modelo} - Matrícula: ${coche.matricula} - ${coche.color}`,
      cantidad: 1,
      precio: precio,
      impuesto: impuesto,
      total: total
    };
    
    setProductos(prev => [...prev, nuevoProducto]);
    toast.success(`Vehículo ${coche.matricula} agregado a la factura`);
  }, [productos, recalcularProducto]);

  const eliminarProducto = useCallback((id: string) => {
    const producto = productos.find(p => p.id === id);
    setProductos(prev => prev.filter(p => p.id !== id));
    if (producto) {
      toast.success(`Vehículo eliminado de la factura`);
    }
  }, [productos]);


  // Función para actualizar precio de un producto
  const actualizarPrecioProducto = useCallback((id: string, nuevoPrecio: number) => {
    setProductos(prev => prev.map(producto => {
      if (producto.id === id) {
        const { impuesto, total } = recalcularProducto(nuevoPrecio, producto.cantidad);
        return {
          ...producto,
          precio: nuevoPrecio,
          impuesto,
          total
        };
      }
      return producto;
    }));
  }, [recalcularProducto]);

  // Función para recalcular todos los productos cuando cambia el tipo de impuesto
  const recalcularTodosLosProductos = useCallback(() => {
    setProductos(prev => prev.map(producto => {
      const { impuesto, total } = recalcularProducto(producto.precio, producto.cantidad);
      return {
        ...producto,
        impuesto,
        total
      };
    }));
  }, [recalcularProducto]);

  // Efecto para recalcular cuando cambia el tipo de impuesto
  useEffect(() => {
    if (productos.length > 0) {
      recalcularTodosLosProductos();
    }
  }, [tipoImpuesto, recalcularTodosLosProductos]);

  const calcularTotales = useMemo(() => {
    const subtotal = productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const totalImpuestos = productos.reduce((sum, p) => sum + p.impuesto, 0);
    const total = subtotal + totalImpuestos;
    return { subtotal, totalImpuestos, total };
  }, [productos]);

  const { subtotal, totalImpuestos, total } = calcularTotales;

  // Función para generar factura
  const generarFactura = useCallback(async () => {
    if (!clienteSeleccionado || !empresaSeleccionada || productos.length === 0) {
      toast.error('Faltan datos para generar la factura');
      return;
    }

    try {
      setGenerandoFactura(true);
      
      // Obtener siguiente número de factura
      const numeroFacturaData: SiguienteNumeroResponse = await facturaService.getSiguienteNumero(empresaSeleccionada.id);
      const numeroFactura = numeroFacturaData.numero_factura;
      
      // Preparar datos de la factura (versión simplificada)
      const facturaData = {
        numero_factura: numeroFactura,
        cliente_id: clienteSeleccionado.id,
        empresa_id: empresaSeleccionada.id,
        fecha_emision: new Date().toISOString().split('T')[0],
        subtotal: subtotal,
        igic: totalImpuestos,
        total: total,
        notas: `Factura generada el ${new Date().toLocaleDateString()}`,
        productos: productos.map(producto => ({
          descripcion: producto.descripcion,
          cantidad: 1,
          precio_unitario: producto.precio,
          subtotal: producto.precio,
          igic: producto.impuesto,
          total: producto.total
        }))
      };

      // Crear la factura
      const facturaCreada = await facturaService.create(facturaData);
      
      // Guardar la factura generada para el PDF
      setFacturaGenerada({
        ...facturaCreada,
        numero: numeroFactura,
        cliente: clienteSeleccionado,
        empresa: empresaSeleccionada,
        productos: productos
      });

      toast.success(`Factura ${numeroFactura} generada exitosamente`);
      
      // Limpiar el formulario
      setProductos([]);
      setClienteSeleccionado(null);
      
    } catch (error) {
      console.error('Error al generar factura:', error);
      
      // Manejar errores específicos
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('ya existe')) {
        toast.error('El número de factura ya existe. Inténtalo de nuevo.');
      } else if (errorMessage.includes('empresa_id')) {
        toast.error('Error con la empresa seleccionada');
      } else {
        toast.error('Error al generar la factura. Inténtalo de nuevo.');
      }
    } finally {
      setGenerandoFactura(false);
    }
  }, [clienteSeleccionado, empresaSeleccionada, productos, subtotal, totalImpuestos, total]);

  // Función para descargar PDF
  const descargarPDF = useCallback(async () => {
    if (!facturaGenerada) {
      toast.error('No hay factura generada para descargar');
      return;
    }

    try {
      // Preparar datos para el PDF
      const pdfData: FacturaPDFData = {
        numero: facturaGenerada.numero,
        fecha: facturaGenerada.fecha_emision,
        cliente: facturaGenerada.cliente.nombre,
        empresa: facturaGenerada.empresa.nombre,
        subtotal: facturaGenerada.subtotal,
        impuesto: facturaGenerada.impuestos,
        total: facturaGenerada.total,
        estado: facturaGenerada.estado,
        productos: facturaGenerada.productos.map((producto: ProductoFactura) => ({
          descripcion: producto.descripcion,
          cantidad: 1, // Siempre 1 para vehículos
          precio: producto.precio
        }))
      };

      // Generar y descargar PDF
      await facturaPDFService.generarPDFFactura(pdfData);
      toast.success('PDF descargado exitosamente');
      
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      toast.error('Error al descargar el PDF');
    }
  }, [facturaGenerada]);

  // Funciones para manejar el modal de empresa
  const handleSeleccionarEmpresa = useCallback(() => {
    setMostrarModalEmpresa(false);
  }, []);

  const handleCancelarSeleccionEmpresa = useCallback(() => {
    setMostrarModalEmpresa(false);
  }, []);

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
                  <Dialog open={mostrarModalEmpresa} onOpenChange={setMostrarModalEmpresa}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center space-x-2"
                        onClick={() => setMostrarModalEmpresa(true)}
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
                          {empresas.map(empresa => (
                            <div 
                              key={empresa.id}
                              className={`p-4 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                                empresaSeleccionada?.id === empresa.id 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200'
                              }`}
                              onClick={() => setEmpresaSeleccionada(empresa)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold tracking-wide">{empresa.nombre}</p>
                                  <p className="text-sm text-gray-600">CIF: {empresa.cif}</p>
                                  <p className="text-sm text-gray-600">{empresa.direccion}</p>
                                </div>
                                {empresaSeleccionada?.id === empresa.id && (
                                  <Badge className="bg-blue-100 text-blue-700">Actual</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {empresas.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <p>No hay empresas disponibles</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-end space-x-2 pt-4">
                          <Button variant="outline" size="sm" onClick={handleCancelarSeleccionEmpresa}>
                            Cancelar
                          </Button>
                          <Button size="sm" onClick={handleSeleccionarEmpresa}>
                            Seleccionar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {empresaSeleccionada ? (
                  <>
                    <p className="font-semibold tracking-wide">{empresaSeleccionada.nombre}</p>
                    <p className="text-gray-600">CIF: {empresaSeleccionada.cif}</p>
                    <p className="text-gray-600">{empresaSeleccionada.direccion}</p>
                    <p className="text-gray-600">{empresaSeleccionada.telefono} | {empresaSeleccionada.email}</p>
                  </>
                ) : (
                  <p className="text-gray-500">No hay empresas disponibles</p>
                )}
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
                                <p className="font-medium text-gray-900">{cliente.nombre || 'Sin nombre'}</p>
                                <p className="text-sm text-gray-500">CIF: {cliente.identificacion || 'Sin CIF'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-400">{cliente.email || 'Sin email'}</p>
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
                    <p className="font-semibold">{clienteSeleccionado.nombre || 'Sin nombre'}</p>
                    <p className="text-gray-600">CIF: {clienteSeleccionado.identificacion || 'Sin CIF'}</p>
                    <p className="text-gray-600">{clienteSeleccionado.direccion || 'Sin dirección'}</p>
                    <p className="text-gray-600">{clienteSeleccionado.email || 'Sin email'}</p>
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
                    {loading.fetching ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p>Cargando vehículos...</p>
                      </div>
                    ) : cochesDisponibles.length > 0 ? (
                      cochesDisponibles.map(coche => (
                        <div
                          key={coche.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                            !coche.vendido 
                              ? 'border-gray-200 hover:border-blue-300' 
                              : 'border-gray-200 opacity-60'
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!coche.vendido) {
                              agregarProducto(coche);
                            }
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {coche.modelo}
                                </h4>
                                <p className="text-sm text-gray-500">Matrícula: {coche.matricula}</p>
                                <p className="text-sm text-gray-500">Color: {coche.color}</p>
                              </div>
                            </div>
                            
                            <div className="text-blue-600">
                              <span className="text-sm">➕ Click para agregar</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl mb-2 block">🚗</span>
                        <p>
                          {productos.length > 0 
                            ? 'Todos los vehículos han sido agregados a la factura' 
                            : 'No hay vehículos registrados'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
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
                              checked={tipoImpuesto === 'igic'}
                              className="text-blue-600"
                              onChange={() => setTipoImpuesto('igic')}
                            />
                            <span className="text-sm">IGIC</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="tax-type"
                              value="iva"
                              checked={tipoImpuesto === 'iva'}
                              className="text-blue-600"
                              onChange={() => setTipoImpuesto('iva')}
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
                          value={impuestoActual.porcentaje}
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
                          <TableHead>Precio</TableHead>
                          <TableHead>{impuestoActual.nombre}</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productos.map(producto => (
                          <TableRow key={producto.id}>
                            <TableCell>{producto.descripcion}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={producto.precio}
                                onChange={(e) => {
                                  const nuevoPrecio = parseFloat(e.target.value) || 0;
                                  actualizarPrecioProducto(producto.id, nuevoPrecio);
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
                  <span className="text-gray-600">{impuestoActual.nombre} ({impuestoActual.porcentaje}%):</span>
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
                  <DialogContent className="max-w-[98vw] w-[98vw] max-h-[95vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle>Vista Previa de Factura</DialogTitle>
                      <DialogDescription>
                        Revisa los detalles de la factura antes de generarla.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="bg-white p-10 border rounded-lg overflow-y-auto max-h-[80vh]">
                      <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-blue-900">FACTURA</h2>
                        <p className="text-lg text-gray-600">Nº C001/2024</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                          <h3 className="font-bold mb-3 text-base border-b pb-1">EMISOR</h3>
                          {empresaSeleccionada ? (
                            <div className="text-base">
                              <p className="font-semibold text-lg tracking-wide">{empresaSeleccionada.nombre}</p>
                              <p className="text-gray-700">CIF: {empresaSeleccionada.cif}</p>
                              <p className="break-words text-gray-700">{empresaSeleccionada.direccion}</p>
                            </div>
                          ) : (
                            <p className="text-gray-500">No hay empresa seleccionada</p>
                          )}
                        </div>
                        {clienteSeleccionado && (
                          <div>
                            <h3 className="font-bold mb-3 text-base border-b pb-1">CLIENTE</h3>
                            <div className="text-base">
                              <p className="font-semibold text-lg">{clienteSeleccionado.nombre}</p>
                              <p className="text-gray-700">CIF: {clienteSeleccionado.identificacion}</p>
                              <p className="break-words text-gray-700">{clienteSeleccionado.direccion}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mb-6">
                        <Table className="w-full">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-3/5">Descripción</TableHead>
                              <TableHead className="w-48 text-right">Precio</TableHead>
                              <TableHead className="w-48 text-right">{impuestoActual.nombre}</TableHead>
                              <TableHead className="w-52 text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {productos.map(producto => (
                              <TableRow key={producto.id}>
                                <TableCell className="break-words text-sm">
                                  {producto.descripcion}
                                </TableCell>
                                <TableCell className="text-right">€{producto.precio.toLocaleString()}</TableCell>
                                <TableCell className="text-right">€{producto.impuesto.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-semibold">€{producto.total.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="border-t-2 pt-6">
                        <div className="flex justify-end">
                          <div className="text-right space-y-3 min-w-[400px]">
                            <div className="flex justify-between text-lg">
                              <span>Subtotal:</span>
                              <span>€{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-lg">
                              <span>{impuestoActual.nombre} ({impuestoActual.porcentaje}%):</span>
                              <span>€{totalImpuestos.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-2xl font-bold text-blue-900 border-t-2 pt-3">
                              <span>TOTAL:</span>
                              <span>€{total.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  disabled={!clienteSeleccionado || productos.length === 0 || generandoFactura}
                  onClick={generarFactura}
                >
                  <span className="mr-2">📄</span>
                  {generandoFactura ? 'Generando...' : 'Generar Factura'}
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={!facturaGenerada}
                  onClick={descargarPDF}
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
                  Puedes cambiar entre IGIC (9.5%) para Canarias o IVA (21%) para península.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

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
import { Building2, RefreshCw, Plus, Car, Eye, FileText, Download, Zap, Info, Trash2, Home, Search } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../ui/pagination';

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
  const [porcentajeIGIC, setPorcentajeIGIC] = useState<number>(9.5);
  const [porcentajeIVA, setPorcentajeIVA] = useState<number>(21);
  const [facturaGenerada, setFacturaGenerada] = useState<any>(null);
  const [generandoFactura, setGenerandoFactura] = useState(false);
  const [busquedaCoche, setBusquedaCoche] = useState<string>('');
  const [paginaCoches, setPaginaCoches] = useState<number>(1);
  const cochesPorPagina = 10;
  
  // Hooks para obtener datos reales
  const { clientes } = useClientes();
  const { coches, cochesDisponibles: cochesDisponiblesHook, loading, refreshCoches } = useCoches();
  const { empresas } = useEmpresas();

  // Configuración de impuestos
  const configuracionImpuestos: Record<TipoImpuesto, ConfiguracionImpuesto> = useMemo(() => ({
    igic: { tipo: 'igic', porcentaje: porcentajeIGIC, nombre: 'IGIC' },
    iva: { tipo: 'iva', porcentaje: porcentajeIVA, nombre: 'IVA' }
  }), [porcentajeIGIC, porcentajeIVA]);

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
  // Usamos cochesDisponiblesHook que ya filtra los vendidos, y luego excluimos los ya en la factura
  const cochesDisponibles = useMemo(() => {
    // Obtener las matrículas de los coches ya agregados a la factura
    const matriculasAgregadas = productos.map(producto => {
      // Extraer la matrícula del texto de descripción
      const match = producto.descripcion.match(/Matrícula: ([A-Z0-9-]+)/);
      return match ? match[1] : null;
    }).filter(Boolean);

    // Filtrar coches que no estén ya en la factura
    // cochesDisponiblesHook ya excluye los vendidos (activo = false/0)
    return cochesDisponiblesHook.filter(coche => 
      !matriculasAgregadas.includes(coche.matricula)
    );
  }, [cochesDisponiblesHook, productos]);

  // Filtrar coches por búsqueda
  const cochesFiltrados = useMemo(() => {
    if (!busquedaCoche.trim()) {
      return cochesDisponibles;
    }
    
    const busquedaLower = busquedaCoche.toLowerCase().trim();
    return cochesDisponibles.filter(coche => 
      coche.matricula?.toLowerCase().includes(busquedaLower) ||
      coche.modelo?.toLowerCase().includes(busquedaLower) ||
      coche.marca?.toLowerCase().includes(busquedaLower) ||
      coche.color?.toLowerCase().includes(busquedaLower)
    );
  }, [cochesDisponibles, busquedaCoche]);

  // Paginar coches filtrados
  const totalPaginasCoches = Math.ceil(cochesFiltrados.length / cochesPorPagina);
  const cochesPaginados = useMemo(() => {
    const inicio = (paginaCoches - 1) * cochesPorPagina;
    const fin = inicio + cochesPorPagina;
    return cochesFiltrados.slice(inicio, fin);
  }, [cochesFiltrados, paginaCoches, cochesPorPagina]);

  // Resetear página cuando cambia la búsqueda
  useEffect(() => {
    setPaginaCoches(1);
  }, [busquedaCoche]);

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

  const handlePorcentajeChange = useCallback((valor: string) => {
    const normalizado = parseFloat(valor.replace(',', '.'));
    const porcentaje = isNaN(normalizado) ? 0 : Math.min(Math.max(normalizado, 0), 100);

    if (tipoImpuesto === 'igic') {
      setPorcentajeIGIC(porcentaje);
    } else {
      setPorcentajeIVA(porcentaje);
    }
  }, [tipoImpuesto]);

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
      total: total,
      cocheId: coche.id?.toString()
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
          total: producto.total,
          coche_id: producto.cocheId || producto.coche_id || null
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
      
      // Recargar coches para que los vendidos no aparezcan en la lista
      await refreshCoches();
      
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
  }, [clienteSeleccionado, empresaSeleccionada, productos, subtotal, totalImpuestos, total, refreshCoches]);

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
                <Home className="w-4 h-4" />
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
        <div className="grid grid-cols-1 gap-6">
          {/* Main Form Area */}
          <div className="space-y-6">
            {/* Datos de la Empresa */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
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
                        <RefreshCw className="w-4 h-4" />
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
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </CardContent>
            </Card>

            {/* Selección de Coches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Car className="w-5 h-5" />
                  <span>Seleccionar Vehículo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Todos los Vehículos</Label>
                  
                  {/* Buscador de coches */}
                  <div className="relative mt-2 mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Buscar por matrícula, modelo, marca o color..."
                      value={busquedaCoche}
                      onChange={(e) => setBusquedaCoche(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Información de resultados */}
                  {!loading.fetching && cochesFiltrados.length > 0 && (
                    <div className="text-sm text-gray-500 mb-2">
                      Mostrando {cochesPaginados.length} de {cochesFiltrados.length} vehículos
                      {busquedaCoche && ` (filtrados por "${busquedaCoche}")`}
                    </div>
                  )}

                  <div className="space-y-2 mt-2">
                    {loading.fetching ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p>Cargando vehículos...</p>
                      </div>
                    ) : cochesPaginados.length > 0 ? (
                      <>
                        {cochesPaginados.map(coche => (
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
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900">
                                      {coche.marca || ''} {coche.modelo}
                                    </h4>
                                    {(coche.tiene_proforma === 1 || coche.tiene_proforma === true || coche.tiene_proforma === '1') && (
                                      <Badge className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5">
                                        <FileText className="w-3 h-3 mr-1" />
                                        Proforma
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">Matrícula: {coche.matricula}</p>
                                  <p className="text-sm text-gray-500">Color: {coche.color}</p>
                                </div>
                              </div>
                              
                              <div className="text-blue-600 flex items-center space-x-1">
                                <Plus className="w-4 h-4" />
                                <span className="text-sm">Click para agregar</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Paginación */}
                        {totalPaginasCoches > 1 && (
                          <div className="mt-4 flex justify-center">
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious 
                                    onClick={() => setPaginaCoches(Math.max(1, paginaCoches - 1))}
                                    className={paginaCoches === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                  />
                                </PaginationItem>
                                
                                {[...Array(totalPaginasCoches)].map((_, i) => {
                                  const pagina = i + 1;
                                  // Mostrar solo algunas páginas alrededor de la actual
                                  if (
                                    pagina === 1 ||
                                    pagina === totalPaginasCoches ||
                                    (pagina >= paginaCoches - 1 && pagina <= paginaCoches + 1)
                                  ) {
                                    return (
                                      <PaginationItem key={pagina}>
                                        <PaginationLink
                                          onClick={() => setPaginaCoches(pagina)}
                                          isActive={paginaCoches === pagina}
                                          className="cursor-pointer"
                                        >
                                          {pagina}
                                        </PaginationLink>
                                      </PaginationItem>
                                    );
                                  } else if (pagina === paginaCoches - 2 || pagina === paginaCoches + 2) {
                                    return (
                                      <PaginationItem key={pagina}>
                                        <span className="px-2">...</span>
                                      </PaginationItem>
                                    );
                                  }
                                  return null;
                                })}
                                
                                <PaginationItem>
                                  <PaginationNext 
                                    onClick={() => {
                                      if (paginaCoches < totalPaginasCoches) {
                                        setPaginaCoches(paginaCoches + 1);
                                      }
                                    }}
                                    className={paginaCoches >= totalPaginasCoches ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Car className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>
                          {busquedaCoche
                            ? `No se encontraron vehículos que coincidan con "${busquedaCoche}"`
                            : productos.length > 0 
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
                          onChange={(e) => handlePorcentajeChange(e.target.value)}
                          className="w-24 text-center"
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
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border rounded-lg p-4 shadow-sm">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Subtotal</p>
                        <p className="text-xl font-semibold text-gray-900">€{subtotal.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">{impuestoActual.nombre} ({impuestoActual.porcentaje}%):</p>
                        <p className="text-xl font-semibold text-gray-900">€{totalImpuestos.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-2xl font-bold text-blue-600">€{total.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Acciones */}
            <div className="flex justify-center">
              <Card className="w-full md:w-4/5 lg:w-2/3">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>Acciones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="flex-1 h-12 justify-center" 
                          disabled={!clienteSeleccionado || productos.length === 0}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Vista Previa
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[90vw] w-[90vw] xl:max-w-[70vw] max-h-[95vh] overflow-hidden">
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
                      className="flex-1 h-12 bg-blue-600 hover:bg-blue-700" 
                      disabled={!clienteSeleccionado || productos.length === 0 || generandoFactura}
                      onClick={generarFactura}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {generandoFactura ? 'Generando...' : 'Generar Factura'}
                    </Button>

                    <Button 
                      variant="outline" 
                      className="flex-1 h-12"
                      disabled={!facturaGenerada}
                      onClick={descargarPDF}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

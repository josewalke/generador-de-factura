import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { proformaService, SiguienteNumeroResponse } from '../../services/proformaService';
import { ProductoProforma } from '../../services/proformaService';
import { toast } from 'sonner';
import { Building2, RefreshCw, Plus, Car, DollarSign, Eye, FileText, Download, Zap, Info, Trash2, Home, Search } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../ui/pagination';

interface ProformasScreenProps {
  onNavigate: (screen: Screen) => void;
}

type TipoImpuesto = 'igic' | 'iva';

interface ConfiguracionImpuesto {
  tipo: TipoImpuesto;
  porcentaje: number;
  nombre: string;
}

export function ProformasScreen({ onNavigate }: ProformasScreenProps) {
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
  const [cocheSeleccionado, setCocheSeleccionado] = useState<Coche | null>(null);
  const [productos, setProductos] = useState<ProductoProforma[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [mostrarModalEmpresa, setMostrarModalEmpresa] = useState(false);
  const [tipoImpuesto, setTipoImpuesto] = useState<TipoImpuesto>('igic');
  const [porcentajeIGIC, setPorcentajeIGIC] = useState<number>(9.5);
  const [porcentajeIVA, setPorcentajeIVA] = useState<number>(21);
  const [proformaGenerada, setProformaGenerada] = useState<any>(null);
  const [generandoProforma, setGenerandoProforma] = useState(false);
  const [fechaValidez, setFechaValidez] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [busquedaCoche, setBusquedaCoche] = useState<string>('');
  const [paginaCoches, setPaginaCoches] = useState<number>(1);
  const cochesPorPagina = 10;
  const notasTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Hooks para obtener datos reales
  const { clientes } = useClientes();
  const { coches, cochesDisponibles: cochesDisponiblesHook, loading, refreshCoches } = useCoches();
  const { empresas } = useEmpresas();

  // Configuración de impuestos con porcentajes editables
  const configuracionImpuestos: Record<TipoImpuesto, ConfiguracionImpuesto> = {
    igic: { tipo: 'igic', porcentaje: porcentajeIGIC, nombre: 'IGIC' },
    iva: { tipo: 'iva', porcentaje: porcentajeIVA, nombre: 'IVA' }
  };

  const impuestoActual = configuracionImpuestos[tipoImpuesto];

  // Seleccionar la primera empresa por defecto
  useEffect(() => {
    if (empresas.length > 0 && !empresaSeleccionada) {
      setEmpresaSeleccionada(empresas[0]);
    }
  }, [empresas, empresaSeleccionada]);

  // Establecer fecha de validez por defecto (hoy)
  useEffect(() => {
    const fecha = new Date();
    setFechaValidez(fecha.toISOString().split('T')[0]);
  }, []);

  // Función para ajustar altura del textarea automáticamente
  const ajustarAlturaTextarea = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(100, textarea.scrollHeight)}px`;
  }, []);

  // Obtener fecha mínima (hoy)
  const fechaMinima = useMemo(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  }, []);

  // Filtrar clientes basado en la búsqueda (memoizado)
  const clientesFiltrados = useMemo(() => 
    clientes.filter(cliente =>
      cliente.nombre?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
      cliente.identificacion?.toLowerCase().includes(busquedaCliente.toLowerCase())
    ), [clientes, busquedaCliente]
  );

  // Filtrar coches disponibles (excluir los ya agregados a la proforma)
  const cochesDisponibles = useMemo(() => {
    const matriculasAgregadas = productos.map(producto => {
      const match = producto.descripcion?.match(/Matrícula: ([A-Z0-9-]+)/);
      return match ? match[1] : null;
    }).filter(Boolean);

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
    
    if (value === '') {
      setClienteSeleccionado(null);
    }
    
    if (clienteSeleccionado && value !== (clienteSeleccionado.nombre || '')) {
      setClienteSeleccionado(null);
    }
  }, [clienteSeleccionado]);

  // Función para recalcular impuestos de un producto
  const recalcularProducto = useCallback((precio: number, cantidad: number = 1): { impuesto: number; total: number } => {
    const subtotal = precio * cantidad;
    const porcentaje = tipoImpuesto === 'igic' ? porcentajeIGIC : porcentajeIVA;
    const impuesto = subtotal * (porcentaje / 100);
    const total = subtotal + impuesto;
    return { impuesto, total };
  }, [tipoImpuesto, porcentajeIGIC, porcentajeIVA]);

  // Cargar coche seleccionado desde sessionStorage (si viene de CochesScreen)
  // Este useEffect debe ir después de recalcularProducto
  useEffect(() => {
    const cocheSeleccionadoStr = sessionStorage.getItem('cocheSeleccionadoParaProforma');
    if (cocheSeleccionadoStr) {
      try {
        const coche = JSON.parse(cocheSeleccionadoStr);
        if (coche && !cocheSeleccionado) {
          setCocheSeleccionado(coche);
          // Agregar el producto directamente usando recalcularProducto
          const precio = coche.precio || 0;
          const { impuesto, total } = recalcularProducto(precio);
          const nuevoProducto: ProductoProforma = {
            id: Date.now().toString(),
            descripcion: `${coche.marca || ''} ${coche.modelo} - Matrícula: ${coche.matricula} - ${coche.color}`.trim(),
            cantidad: 1,
            precio: precio,
            precioUnitario: precio,
            igic: impuesto,
            impuesto: impuesto,
            total: total,
            subtotal: precio,
            cocheId: coche.id?.toString(),
            coche_id: coche.id?.toString()
          };
          setProductos(prev => [...prev, nuevoProducto]);
          // Limpiar sessionStorage después de usar
          sessionStorage.removeItem('cocheSeleccionadoParaProforma');
        }
      } catch (error) {
        console.error('Error al cargar coche seleccionado:', error);
        sessionStorage.removeItem('cocheSeleccionadoParaProforma');
      }
    }
  }, [recalcularProducto, cocheSeleccionado]);

  const agregarProducto = useCallback((coche: Coche) => {
    const yaExiste = productos.some(producto => 
      producto.descripcion?.includes(coche.matricula)
    );
    
    if (yaExiste) {
      toast.warning('Este vehículo ya está en la proforma');
      return;
    }
    
    const precio = coche.precio || 0;
    const { impuesto, total } = recalcularProducto(precio);
    
    const nuevoProducto: ProductoProforma = {
      id: Date.now().toString(),
      descripcion: `${coche.marca || ''} ${coche.modelo} - Matrícula: ${coche.matricula} - ${coche.color}`.trim(),
      cantidad: 1,
      precio: precio,
      precioUnitario: precio,
      igic: impuesto,
      impuesto: impuesto,
      total: total,
      subtotal: precio,
      cocheId: coche.id?.toString(),
      coche_id: coche.id?.toString()
    };
    
    setProductos(prev => [...prev, nuevoProducto]);
    setCocheSeleccionado(coche);
    toast.success(`Vehículo ${coche.matricula} agregado a la proforma`);
  }, [productos, recalcularProducto]);

  const eliminarProducto = useCallback((id: string) => {
    const producto = productos.find(p => p.id === id);
    setProductos(prev => prev.filter(p => p.id !== id));
    if (producto) {
      toast.success(`Vehículo eliminado de la proforma`);
    }
    if (productos.length === 1) {
      setCocheSeleccionado(null);
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
          precioUnitario: nuevoPrecio,
          igic: impuesto,
          impuesto,
          total,
          subtotal: nuevoPrecio * producto.cantidad
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
        igic: impuesto,
        impuesto,
        total,
        subtotal: producto.precio * producto.cantidad
      };
    }));
  }, [recalcularProducto]);

  // Efecto para recalcular cuando cambia el tipo de impuesto o los porcentajes
  useEffect(() => {
    if (productos.length > 0) {
      recalcularTodosLosProductos();
    }
  }, [tipoImpuesto, porcentajeIGIC, porcentajeIVA, recalcularTodosLosProductos]);

  const calcularTotales = useMemo(() => {
    const subtotal = productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const totalImpuestos = productos.reduce((sum, p) => sum + (p.igic || p.impuesto || 0), 0);
    const total = subtotal + totalImpuestos;
    return { subtotal, totalImpuestos, total };
  }, [productos]);

  const { subtotal, totalImpuestos, total } = calcularTotales;

  // Función para generar proforma
  const generarProforma = useCallback(async () => {
    if (!empresaSeleccionada || productos.length === 0) {
      toast.error('Faltan datos para generar la proforma');
      return;
    }

    try {
      setGenerandoProforma(true);
      
      // Obtener siguiente número de proforma
      const numeroProformaData: any = await proformaService.getSiguienteNumero(empresaSeleccionada.id);
      // handleApiResponse devuelve response.data.data si existe, o response.data
      // Por lo tanto, puede ser { numero_proforma, ... } o { data: { numero_proforma, ... } }
      const numeroProforma = numeroProformaData.data?.numero_proforma || numeroProformaData.numero_proforma;
      
      if (!numeroProforma) {
        throw new Error('No se pudo obtener el número de proforma');
      }
      
      // Preparar datos de la proforma
      const proformaData = {
        numero_proforma: numeroProforma,
        cliente_id: clienteSeleccionado?.id || undefined,
        empresa_id: empresaSeleccionada.id,
        coche_id: cocheSeleccionado?.id || undefined,
        fecha_emision: new Date().toISOString().split('T')[0],
        fecha_validez: fechaValidez || undefined,
        subtotal: subtotal,
        igic: totalImpuestos,
        total: total,
        notas: notas || `Proforma generada el ${new Date().toLocaleDateString()}`,
        estado: 'pendiente',
        productos: productos.map(producto => ({
          descripcion: producto.descripcion || '',
          cantidad: producto.cantidad || 1,
          precio_unitario: producto.precioUnitario || producto.precio || 0,
          subtotal: producto.subtotal || (producto.precio * producto.cantidad),
          igic: producto.igic !== undefined ? producto.igic : (producto.impuesto || 0),
          total: producto.total || (producto.precio * producto.cantidad + (producto.igic || producto.impuesto || 0)),
          coche_id: producto.coche_id || producto.cocheId || cocheSeleccionado?.id || null,
          tipo_impuesto: producto.tipo_impuesto || producto.tipoImpuesto || tipoImpuesto
        }))
      };

      // Crear la proforma
      const proformaCreada = await proformaService.create(proformaData);
      
      // Guardar la proforma generada
      setProformaGenerada({
        ...proformaCreada,
        numero: numeroProforma,
        cliente: clienteSeleccionado,
        empresa: empresaSeleccionada,
        coche: cocheSeleccionado,
        productos: productos
      });

      toast.success(`Proforma ${numeroProforma} generada exitosamente`);
      
      // Limpiar el formulario
      setProductos([]);
      setClienteSeleccionado(null);
      setCocheSeleccionado(null);
      setNotas('');
      
    } catch (error) {
      console.error('Error al generar proforma:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('ya existe')) {
        toast.error('El número de proforma ya existe. Inténtalo de nuevo.');
      } else if (errorMessage.includes('empresa_id')) {
        toast.error('Error con la empresa seleccionada');
      } else {
        toast.error('Error al generar la proforma. Inténtalo de nuevo.');
      }
    } finally {
      setGenerandoProforma(false);
    }
  }, [clienteSeleccionado, empresaSeleccionada, cocheSeleccionado, productos, subtotal, totalImpuestos, total, fechaValidez, notas, tipoImpuesto]);

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
                <h1 className="text-2xl font-bold text-gray-900">Generar Proforma</h1>
                <p className="text-gray-600">Presupuesto sin validez fiscal</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
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
                          Elige la empresa que emitirá esta proforma.
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
                              onClick={() => {
                                setEmpresaSeleccionada(empresa);
                                setMostrarModalEmpresa(false);
                              }}
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
                  <span>Datos del Cliente (Opcional)</span>
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
                        setTimeout(() => setDropdownAbierto(false), 200);
                      }}
                    />
                    
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
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
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
                  </div>
                )}
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
                            className="p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 border-gray-200 hover:border-blue-300"
                            onClick={() => agregarProducto(coche)}
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
                            ? 'Todos los vehículos han sido agregados a la proforma' 
                            : 'No hay vehículos registrados'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Productos en la Proforma */}
            {productos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-lg">📋</span>
                    <span>Productos en la Proforma</span>
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
                          value={tipoImpuesto === 'igic' ? porcentajeIGIC : porcentajeIVA}
                          onChange={(e) => {
                            const valor = parseFloat(e.target.value) || 0;
                            if (tipoImpuesto === 'igic') {
                              setPorcentajeIGIC(valor);
                            } else {
                              setPorcentajeIVA(valor);
                            }
                          }}
                          className="w-16 text-center"
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
                                  actualizarPrecioProducto(producto.id!, nuevoPrecio);
                                }}
                                className="w-24 text-right"
                                min="0"
                                step="0.01"
                              />
                            </TableCell>
                            <TableCell>€{(producto.igic || producto.impuesto || 0).toLocaleString()}</TableCell>
                            <TableCell className="font-semibold">€{(producto.total || 0).toLocaleString()}</TableCell>
                            <TableCell>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => eliminarProducto(producto.id!)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Totales integrados */}
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
                        <p className="text-2xl font-bold text-purple-600">€{total.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fecha de Validez y Notas */}
            {productos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Información Adicional</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fechaValidez">Fecha de Validez</Label>
                    <Input
                      id="fechaValidez"
                      type="date"
                      value={fechaValidez}
                      min={fechaMinima}
                      onChange={(e) => {
                        const fechaSeleccionada = e.target.value;
                        if (fechaSeleccionada >= fechaMinima) {
                          setFechaValidez(fechaSeleccionada);
                        }
                      }}
                      className="w-auto max-w-[200px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notas">Notas (Opcional)</Label>
                    <textarea
                      ref={notasTextareaRef}
                      id="notas"
                      className="w-full min-h-[100px] p-2 border rounded-md resize-none overflow-hidden"
                      value={notas}
                      onChange={(e) => {
                        setNotas(e.target.value);
                        ajustarAlturaTextarea(e.target);
                      }}
                      onInput={(e) => {
                        ajustarAlturaTextarea(e.target as HTMLTextAreaElement);
                      }}
                      placeholder="Añade notas adicionales para la proforma..."
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Acciones - al final del contenido */}
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
                    <Button 
                      className="flex-1 h-12 bg-purple-600 hover:bg-purple-700" 
                      disabled={productos.length === 0 || generandoProforma}
                      onClick={generarProforma}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {generandoProforma ? 'Generando...' : 'Generar Proforma'}
                    </Button>
                  </div>
                  
                  {/* Info integrada */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <div className="flex items-start space-x-2">
                      <Info className="w-5 h-5 text-purple-600 mt-0.5" />
                      <p className="text-sm text-gray-600">
                        Las proformas son presupuestos sin validez fiscal. Se numeran automáticamente siguiendo el formato PRO-XXX/YYYY.
                        Puedes cambiar entre IGIC (9.5%) para Canarias o IVA (21%) para península.
                      </p>
                    </div>
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


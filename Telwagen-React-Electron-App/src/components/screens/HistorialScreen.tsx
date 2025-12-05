import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../ui/pagination';
import { Eye, BarChart3, FileText, DollarSign, Search, Download, Plus, AlertCircle, Mail, Home, Zap, CalendarDays, RefreshCw, Split } from 'lucide-react';
import { toast } from 'sonner';
import { Screen } from '../../App';
import '../../styles/historial-proforma-modal.css';
import { facturaPDFService } from '../../services/facturaPDFService';
import { proformaPDFService } from '../../services/proformaPDFService';
import { reporteService } from '../../services/reporteService';
import { facturaService, Factura } from '../../services/facturaService';
import { proformaService, Proforma } from '../../services/proformaService';
import { empresaService, Empresa } from '../../services/empresaService';

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
  const [loadingTabla, setLoadingTabla] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ page: number; totalPages: number; totalCount: number }>({ page: 1, totalPages: 1, totalCount: 0 });
  const [stats, setStats] = useState<{ totalFacturas: number; ingresos: number; ingresosTotales: number; promedio: number }>({
    totalFacturas: 0,
    ingresos: 0,
    ingresosTotales: 0,
    promedio: 0
  });
  const [resumenSeleccionado, setResumenSeleccionado] = useState<{ facturas: number; ingresos: number; promedio: number }>({
    facturas: 0,
    ingresos: 0,
    promedio: 0
  });
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>('todos'); // Cambiar a 'todos' por defecto para ver todas las facturas
  const [añosDisponibles, setAñosDisponibles] = useState<string[]>([new Date().getFullYear().toString()]);
  const [empresasDisponibles, setEmpresasDisponibles] = useState<Empresa[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const filtrosRef = useRef<string>('');
  const paginaRef = useRef<number>(1);

  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [proformaDetalle, setProformaDetalle] = useState<Proforma | null>(null);
  const [proformaDetalleId, setProformaDetalleId] = useState<string | null>(null);
  const [loadingProformas, setLoadingProformas] = useState(true);
  const [loadingTablaProformas, setLoadingTablaProformas] = useState(false);
  const [loadingProformaDetalle, setLoadingProformaDetalle] = useState(false);
  const [errorProformas, setErrorProformas] = useState<string | null>(null);
  const [paginationProformas, setPaginationProformas] = useState<{ page: number; totalPages: number; totalCount: number }>({ page: 1, totalPages: 1, totalCount: 0 });
  const [statsProformas, setStatsProformas] = useState<{ total: number; totalImporte: number; promedio: number }>({ total: 0, totalImporte: 0, promedio: 0 });
  const [paginaProformas, setPaginaProformas] = useState(1);
  const filtrosProformasRef = useRef<string>('');
  const paginaProformasRef = useRef<number>(1);
  const [dividiendoProforma, setDividiendoProforma] = useState<string | null>(null);
  const [proformasConDetalles, setProformasConDetalles] = useState<Map<string, { cochesCount: number }>>(new Map());
  const [dividiendoFactura, setDividiendoFactura] = useState<string | null>(null);
  const [facturasConDetalles, setFacturasConDetalles] = useState<Map<string, { cochesCount: number }>>(new Map());
  
  // Filtros independientes para proformas
  const [busquedaProformas, setBusquedaProformas] = useState('');
  const [filtroEmpresaProformas, setFiltroEmpresaProformas] = useState('todos');
  const [filtroClienteProformas, setFiltroClienteProformas] = useState('todos');
  const [filtroEstadoProformas, setFiltroEstadoProformas] = useState('todos');
  const [selectedYearProformas, setSelectedYearProformas] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonthProformas, setSelectedMonthProformas] = useState<string>(new Date().getMonth().toString());
  const [vistaActualProformas, setVistaActualProformas] = useState<'tabla' | 'tarjetas'>('tabla');

  const itemsPorPagina = 10;

  const monthOptions = [
    { label: 'Todos los meses', value: 'todos' },
    { label: 'Enero', value: '0' },
    { label: 'Febrero', value: '1' },
    { label: 'Marzo', value: '2' },
    { label: 'Abril', value: '3' },
    { label: 'Mayo', value: '4' },
    { label: 'Junio', value: '5' },
    { label: 'Julio', value: '6' },
    { label: 'Agosto', value: '7' },
    { label: 'Septiembre', value: '8' },
    { label: 'Octubre', value: '9' },
    { label: 'Noviembre', value: '10' },
    { label: 'Diciembre', value: '11' },
  ];

  const getDateRange = useCallback((year: string, month: string) => {
    const parsedYear = parseInt(year, 10);
    if (isNaN(parsedYear)) return null;
    
    if (month === 'todos') {
      const inicio = new Date(parsedYear, 0, 1);
      const fin = new Date(parsedYear, 11, 31);
      return {
        desde: inicio.toISOString().split('T')[0],
        hasta: fin.toISOString().split('T')[0]
      };
    }
    
    const parsedMonth = parseInt(month, 10);
    if (isNaN(parsedMonth)) return null;
    
    const inicio = new Date(parsedYear, parsedMonth, 1);
    const fin = new Date(parsedYear, parsedMonth + 1, 0);
    return {
      desde: inicio.toISOString().split('T')[0],
      hasta: fin.toISOString().split('T')[0]
    };
  }, []);
  
  const filtrosActuales = useMemo(() => {
    const rango = getDateRange(selectedYear, selectedMonth);
    return {
      search: busqueda || undefined,
      empresa_id: filtroEmpresa !== 'todos' ? filtroEmpresa : undefined,
      cliente_id: filtroCliente !== 'todos' ? filtroCliente : undefined,
      fecha_desde: rango?.desde,
      fecha_hasta: rango?.hasta
    };
  }, [busqueda, filtroEmpresa, filtroCliente, selectedYear, selectedMonth, getDateRange]);
  
  const filtrosProformasActuales = useMemo(() => {
    const rango = getDateRange(selectedYearProformas, selectedMonthProformas);
    return {
      search: busquedaProformas || undefined,
      empresa_id: filtroEmpresaProformas !== 'todos' ? filtroEmpresaProformas : undefined,
      cliente_id: filtroClienteProformas !== 'todos' ? filtroClienteProformas : undefined,
      estado: filtroEstadoProformas !== 'todos' ? filtroEstadoProformas : undefined,
      fecha_desde: rango?.desde,
      fecha_hasta: rango?.hasta
    };
  }, [busquedaProformas, filtroEmpresaProformas, filtroClienteProformas, filtroEstadoProformas, selectedYearProformas, selectedMonthProformas, getDateRange]);
  
  const cargarFacturas = useCallback(async ({ soloTabla = false }: { soloTabla?: boolean } = {}) => {
    try {
      if (soloTabla) {
        setLoadingTabla(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      console.log('🔍 [HistorialScreen] Cargando facturas con filtros:', filtrosActuales);
      const response = await facturaService.getAllWithProducts(paginaActual, itemsPorPagina, filtrosActuales);
      console.log('📊 [HistorialScreen] Facturas recibidas:', response.data?.length || 0, response.data);
      setFacturas(response.data || []);
      setPagination({
        page: response.pagination?.page || paginaActual,
        totalPages: response.pagination?.totalPages || 1,
        totalCount: response.pagination?.totalCount ? Number(response.pagination.totalCount) : (response.data?.length || 0)
      });
      
      if (response.resumen) {
        const resumen = response.resumen;
        const ingresosTotales = resumen.ingresosTotales ?? resumen.ingresos ?? 0;
        setStats({
          totalFacturas: resumen.totalFacturas || 0,
          ingresos: resumen.ingresos || 0,
          ingresosTotales,
          promedio: resumen.promedio || 0
        });
        setResumenSeleccionado({
          facturas: resumen.totalFacturas || 0,
          ingresos: ingresosTotales,
          promedio: resumen.promedio || 0
        });
      }
      
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar facturas');
      console.error('Error fetching facturas:', err);
    } finally {
      if (soloTabla) {
        setLoadingTabla(false);
      } else {
        setLoading(false);
      }
    }
  }, [filtrosActuales, paginaActual, itemsPorPagina, initialLoadComplete]);

  const cargarProformas = useCallback(async ({ soloTabla = false }: { soloTabla?: boolean } = {}) => {
    try {
      if (soloTabla) {
        setLoadingTablaProformas(true);
      } else {
        setLoadingProformas(true);
      }
      setErrorProformas(null);

      const response = await proformaService.getAll({
        ...filtrosProformasActuales,
        page: paginaProformas,
        limit: itemsPorPagina
      });

      const data = response.data || [];
      setProformas(data);
      setPaginationProformas({
        page: response.pagination?.page || paginaProformas,
        totalPages: response.pagination?.totalPages || 1,
        totalCount: response.pagination?.totalCount || response.pagination?.total || data.length
      });

      const totalImporte = data.reduce((sum, proforma) => sum + Number(proforma.total || 0), 0);
      const totalRegistros = response.pagination?.totalCount || response.pagination?.total || data.length;
      setStatsProformas({
        total: totalRegistros,
        totalImporte,
        promedio: totalRegistros > 0 ? totalImporte / totalRegistros : 0
      });
    } catch (err) {
      setErrorProformas(err instanceof Error ? err.message : 'Error al cargar proformas');
      console.error('Error fetching proformas:', err);
    } finally {
      if (soloTabla) {
        setLoadingTablaProformas(false);
      } else {
        setLoadingProformas(false);
      }
    }
  }, [filtrosProformasActuales, paginaProformas, itemsPorPagina]);
  
  const filtrosKey = JSON.stringify(filtrosActuales);
  const filtrosProformasKey = JSON.stringify(filtrosProformasActuales);
  
  useEffect(() => {
    const soloTabla = filtrosRef.current === filtrosKey && paginaRef.current !== paginaActual;
    cargarFacturas({ soloTabla });
    filtrosRef.current = filtrosKey;
    paginaRef.current = paginaActual;
  }, [cargarFacturas, filtrosKey, paginaActual]);

  useEffect(() => {
    const soloTabla = filtrosProformasRef.current === filtrosProformasKey && paginaProformasRef.current !== paginaProformas;
    cargarProformas({ soloTabla });
    filtrosProformasRef.current = filtrosProformasKey;
    paginaProformasRef.current = paginaProformas;
  }, [cargarProformas, filtrosProformasKey, paginaProformas]);
  
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroEmpresa, filtroCliente, selectedMonth, selectedYear]);
  
  useEffect(() => {
    setPaginaProformas(1);
  }, [busquedaProformas, filtroEmpresaProformas, filtroClienteProformas, filtroEstadoProformas, selectedMonthProformas, selectedYearProformas]);
  
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [anios, empresasResp] = await Promise.all([
          facturaService.getYears().catch(() => []),
          empresaService.getAll(1, 100).catch(() => ({ data: [] }))
        ]);
        
        if (Array.isArray(anios) && anios.length > 0) {
          setAñosDisponibles(anios);
          if (!anios.includes(selectedYear)) {
            setSelectedYear(anios[0]);
          }
        }
        
        if (empresasResp && Array.isArray(empresasResp.data)) {
          setEmpresasDisponibles(empresasResp.data);
        }
      } catch (error) {
        console.error('Error cargando datos iniciales de historial:', error);
      }
    };
    
    loadInitialData();
  }, []);
  
  const totalPaginas = pagination.totalPages || 1;
  const facturasParaMostrar = facturas || [];
  const facturasPaginadas = useMemo(() => facturasParaMostrar, [facturasParaMostrar]);
  const totalPaginasProformas = paginationProformas.totalPages || 1;
  const proformasParaMostrar = proformas || [];
  
  const mesSeleccionadoLabel = selectedMonth === 'todos'
    ? 'Todos los meses'
    : (monthOptions.find(month => month.value === selectedMonth)?.label || 'Mes seleccionado');

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
      
      // Obtener datos completos de la factura para incluir VeriFactu
      let facturaCompleta: any = factura;
      if (factura.id && (!factura.codigoVeriFactu || !factura.hashDocumento)) {
        try {
          facturaCompleta = await facturaService.getById(factura.id);
        } catch (error) {
          console.warn('No se pudieron obtener datos completos de VeriFactu, usando datos básicos');
        }
      }
      
      const facturaData = {
        numero: facturaCompleta.numero_factura || factura.numero,
        fecha: facturaCompleta.fecha_emision || factura.fecha,
        cliente: facturaCompleta.cliente_nombre || factura.cliente,
        clienteDireccion: facturaCompleta.cliente_direccion || factura.cliente_direccion,
        clienteNif: facturaCompleta.cliente_nif || factura.cliente_nif || facturaCompleta.cliente_identificacion,
        clienteTelefono: facturaCompleta.cliente_telefono || factura.cliente_telefono,
        clienteEmail: facturaCompleta.cliente_email || factura.cliente_email,
        clienteCodigoPostal: facturaCompleta.cliente_codigo_postal || factura.cliente_codigo_postal,
        clienteProvincia: facturaCompleta.cliente_provincia || factura.cliente_provincia,
        clientePais: facturaCompleta.cliente_pais || factura.cliente_pais,
        clienteCodigoPais: facturaCompleta.cliente_codigo_pais || factura.cliente_codigo_pais,
        clienteTipoIdentificacion: facturaCompleta.cliente_tipo_identificacion || factura.cliente_tipo_identificacion,
        clienteRegimenFiscal: facturaCompleta.cliente_regimen_fiscal || factura.cliente_regimen_fiscal,
        empresa: facturaCompleta.empresa_nombre || factura.empresa,
        subtotal: facturaCompleta.subtotal || factura.subtotal,
        impuesto: facturaCompleta.igic || factura.impuesto,
        total: facturaCompleta.total || factura.total,
        estado: facturaCompleta.estado || factura.estado,
        codigoVeriFactu: facturaCompleta.codigo_verifactu || facturaCompleta.codigoVeriFactu,
        hashDocumento: facturaCompleta.hash_documento || facturaCompleta.hashDocumento,
        productos: factura.productos || (facturaCompleta.detalles || []).map((detalle: any) => ({
          descripcion: detalle.descripcion || 'Producto sin descripción',
          cantidad: detalle.cantidad || 1,
          precio: detalle.precio_unitario || detalle.precio || 0,
          marca: detalle.coche_marca || detalle.marca,
          modelo: detalle.coche_modelo || detalle.modelo,
          matricula: detalle.coche_matricula || detalle.matricula,
          color: detalle.coche_color || detalle.color,
          kilometros: detalle.coche_kms || detalle.kilometros,
          chasis: detalle.coche_chasis || detalle.chasis
        }))
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

  const handleVerFactura = async (facturaId: string) => {
    try {
      const detalle = await facturaService.getById(facturaId);
      setFacturaDetalle(detalle);
      
      // Guardar el número de coches para esta factura
      const cochesCount = detalle.detalles?.filter((d: any) => d.coche_id).length || 0;
      setFacturasConDetalles(prev => new Map(prev).set(facturaId, { cochesCount }));
    } catch (error) {
      console.error('📄 [HistorialScreen] Error al cargar factura:', error);
    }
  };

  const handleDividirFactura = async (facturaId: string) => {
    // Cargar detalle primero para verificar si tiene múltiples coches
    let detalle: Factura | null = null;
    if (facturaDetalle?.id === facturaId) {
      detalle = facturaDetalle;
    } else {
      try {
        detalle = await facturaService.getById(facturaId);
      } catch (error) {
        toast.error('Error al cargar el detalle de la factura');
        return;
      }
    }

    // Verificar que tenga múltiples coches
    const cochesConId = detalle?.detalles?.filter((d: any) => d.coche_id) || [];
    if (cochesConId.length <= 1) {
      toast.warning('Esta factura solo tiene un coche. No es necesario dividirla.');
      return;
    }

    if (!confirm(`¿Está seguro de que desea dividir esta factura en ${cochesConId.length} facturas individuales? Se crearán nuevas facturas, una por cada coche.`)) {
      return;
    }

    try {
      setDividiendoFactura(facturaId);
      const resultado: any = await facturaService.dividirEnIndividuales(facturaId);
      
      const message = resultado.message || (resultado.data?.message || `Factura dividida en ${resultado.data?.facturas_creadas?.length || resultado.facturas_creadas?.length || 0} facturas individuales`);
      toast.success(message);
      
      // Recargar facturas
      await cargarFacturas();
    } catch (error: any) {
      console.error('Error al dividir factura:', error);
      toast.error(error.response?.data?.error || error.message || 'Error al dividir la factura');
    } finally {
      setDividiendoFactura(null);
    }
  };

  // Función para verificar si se puede dividir una factura
  const puedeDividirFactura = (factura: any): boolean => {
    // No mostrar si ya está anulada
    if (factura.estado === 'anulado') {
      return false;
    }
    
    // Usar el campo coches_count del backend si está disponible
    const cochesCount = factura.coches_count || factura.cochesCount;
    if (cochesCount !== undefined && cochesCount !== null) {
      return cochesCount > 1;
    }
    
    // Si no tenemos el conteo del backend, usar la información de los detalles cargados
    const detallesInfo = facturasConDetalles.get(factura.id);
    if (detallesInfo) {
      return detallesInfo.cochesCount > 1;
    }
    
    // Si no tenemos información, no mostrar el botón por seguridad
    return false;
  };

  const handleVerProforma = async (proformaId: string) => {
    try {
      setLoadingProformaDetalle(true);
      setProformaDetalle(null);
      setProformaDetalleId(proformaId);
      const detalle = await proformaService.getById(proformaId);
      setProformaDetalle(detalle);
      
      // Guardar el número de coches para esta proforma
      const cochesCount = detalle.detalles?.filter((d: any) => d.coche_id).length || 0;
      setProformasConDetalles(prev => new Map(prev).set(proformaId, { cochesCount }));
    } catch (error) {
      console.error('📄 [HistorialScreen] Error al cargar proforma:', error);
      alert('Error al cargar la proforma. Por favor, inténtelo de nuevo.');
    } finally {
      setLoadingProformaDetalle(false);
    }
  };
  
  // Función para verificar si se puede dividir una proforma
  const puedeDividirProforma = (proforma: any): boolean => {
    // No mostrar si ya está anulada
    if (proforma.estado === 'anulado') {
      return false;
    }
    
    // Usar el campo coches_count del backend si está disponible
    const cochesCount = proforma.coches_count || proforma.cochesCount;
    if (cochesCount !== undefined && cochesCount !== null) {
      return cochesCount > 1;
    }
    
    // Si no tenemos el conteo del backend, usar la información de los detalles cargados
    const detallesInfo = proformasConDetalles.get(proforma.id);
    if (detallesInfo) {
      return detallesInfo.cochesCount > 1;
    }
    
    // Si no tenemos información, no mostrar el botón por seguridad
    return false;
  };

  const handleDividirProforma = async (proformaId: string) => {
    // Cargar detalle primero para verificar si tiene múltiples coches
    let detalle: Proforma | null = null;
    if (proformaDetalleId === proformaId && proformaDetalle) {
      detalle = proformaDetalle;
    } else {
      try {
        setLoadingProformaDetalle(true);
        detalle = await proformaService.getById(proformaId);
      } catch (error) {
        toast.error('Error al cargar el detalle de la proforma');
        return;
      } finally {
        setLoadingProformaDetalle(false);
      }
    }

    // Verificar que tenga múltiples coches
    const cochesConId = detalle?.detalles?.filter((d: any) => d.coche_id) || [];
    if (cochesConId.length <= 1) {
      toast.warning('Esta proforma solo tiene un coche. No es necesario dividirla.');
      return;
    }

    if (!confirm(`¿Está seguro de que desea dividir esta proforma en ${cochesConId.length} proformas individuales? Se crearán nuevas proformas, una por cada coche.`)) {
      return;
    }

    try {
      setDividiendoProforma(proformaId);
      const resultado: any = await proformaService.dividirEnIndividuales(proformaId);
      
      // handleApiResponse devuelve response.data.data si existe, o response.data
      const message = resultado.message || (resultado.data?.message || `Proforma dividida en ${resultado.data?.proformas_creadas?.length || resultado.proformas_creadas?.length || 0} proformas individuales`);
      toast.success(message);
      
      // Recargar proformas
      await cargarProformas();
    } catch (error: any) {
      console.error('Error al dividir proforma:', error);
      toast.error(error.response?.data?.error || error.message || 'Error al dividir la proforma');
    } finally {
      setDividiendoProforma(null);
    }
  };

  const handleDescargarProformaPDF = async (proforma: Proforma) => {
    try {
      const detalle = await proformaService.getById(proforma.id);
      await proformaPDFService.generarPDFProforma({
        numero: detalle.numero_proforma,
        fecha: detalle.fecha_emision,
        cliente: detalle.cliente_nombre || 'Cliente no especificado',
        clienteCif: detalle.cliente_identificacion,
        clienteDireccion: detalle.cliente_direccion || '',
        empresa: detalle.empresa_nombre || 'Empresa no especificada',
        subtotal: detalle.subtotal,
        impuesto: detalle.igic,
        total: detalle.total,
        estado: detalle.estado,
        productos: (detalle.detalles || []).map(detalleProducto => ({
          descripcion: detalleProducto.descripcion || 'Producto sin descripción',
          cantidad: detalleProducto.cantidad || 1,
          precio: detalleProducto.precio_unitario || detalleProducto.precio || 0,
          marca: detalleProducto.marca || detalleProducto.coche_marca,
          modelo: detalleProducto.modelo || detalleProducto.coche_modelo,
          matricula: detalleProducto.matricula || detalleProducto.coche_matricula,
          color: detalleProducto.color || detalleProducto.coche_color,
          kilometros: detalleProducto.kilometros || detalleProducto.coche_kms,
          chasis: detalleProducto.chasis || detalleProducto.coche_chasis
        }))
      });
    } catch (error) {
      console.error('📄 [HistorialScreen] Error al descargar PDF de proforma:', error);
      alert('Error al generar el PDF de la proforma. Por favor, inténtelo de nuevo.');
    }
  };

  const mostrarPantallaCarga = !initialLoadComplete && (loading || loadingTabla);

  // Mostrar estado de carga inicial
  if (mostrarPantallaCarga) {
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
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
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
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <BarChart3 className="w-6 h-6" />
                  <span>Historial de Facturas</span>
                </h1>
                <p className="text-gray-600">Registro de todas las facturas generadas</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => cargarFacturas()}
              className="flex items-center space-x-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
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
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ingresos del periodo</p>
                      <p className="text-xl font-bold text-blue-600">
                        €{(stats.ingresosTotales || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Proformas</p>
                      <p className="text-2xl font-bold text-purple-600">{statsProformas.total}</p>
                      <p className="text-xs text-gray-500">
                        Valor estimado €{statsProformas.totalImporte.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
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
                    <Search className="w-5 h-5" />
                    <span>Historial de Facturas</span>
                  </CardTitle>
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
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
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
                      {empresasDisponibles.map(empresa => (
                        <SelectItem key={empresa.id} value={empresa.id.toString()}>
                          {empresa.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedMonth} onValueChange={(value) => { setSelectedMonth(value); setPaginaActual(1); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map(month => (
                        <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedYear} onValueChange={(value) => { setSelectedYear(value); setPaginaActual(1); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      {añosDisponibles.map(año => (
                        <SelectItem key={año} value={año}>{año}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs value={vistaActual}>
                  <TabsContent value="tabla" className="space-y-4">
                    <div className="relative">
                      {loadingTabla && (
                        <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center">
                          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mb-2" />
                          <span className="text-sm text-blue-600">Actualizando página...</span>
                        </div>
                      )}
                      <Table className={loadingTabla ? 'opacity-50 pointer-events-none' : ''}>
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
                                <p className="font-semibold text-sm">{factura.numero_factura || factura.numero}</p>
                              </TableCell>
                              <TableCell className="px-2 py-2 whitespace-nowrap">
                                <p className="text-sm">{new Date(factura.fecha_emision || factura.fecha).toLocaleDateString()}</p>
                              </TableCell>
                              <TableCell className="px-2 py-2 break-words">
                                <div className="font-medium leading-tight text-sm">
                                  {factura.cliente_nombre || factura.cliente}
                                </div>
                                <div className="text-muted-foreground text-xs leading-tight">
                                  {factura.empresa_nombre || factura.empresa}
                                </div>
                              </TableCell>
                              <TableCell className="px-2 py-2 text-right whitespace-nowrap">
                                <p className="text-sm">€{(factura.subtotal || 0).toLocaleString()}</p>
                              </TableCell>
                              <TableCell className="px-2 py-2 text-right whitespace-nowrap">
                                <p className="text-sm">€{(factura.igic || factura.impuesto || 0).toLocaleString()}</p>
                              </TableCell>
                              <TableCell className="px-2 py-2 text-right font-semibold text-blue-600 whitespace-nowrap">
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
                                        onClick={() => {
                                          setFacturaDetalle(factura);
                                          handleVerFactura(factura.id);
                                        }}
                                      >
                                        <Eye className="size-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle>Detalle de Factura {factura.numero_factura || factura.numero}</DialogTitle>
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
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  {puedeDividirFactura(factura) && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="w-8 h-8 p-0 border-purple-300 text-purple-700 hover:bg-purple-50"
                                      onClick={() => handleDividirFactura(factura.id)}
                                      disabled={dividiendoFactura === factura.id}
                                      title="Dividir en facturas individuales"
                                    >
                                      {dividiendoFactura === factura.id ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Split className="w-4 h-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Paginación */}
                    {totalPaginas > 1 && (
                      <div className="flex justify-center mt-6">
                        <Pagination>
                          <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => !loadingTabla && setPaginaActual(Math.max(1, paginaActual - 1))}
                              className={paginaActual === 1 || loadingTabla ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          
                          {[...Array(totalPaginas)].map((_, i) => (
                            <PaginationItem key={i + 1}>
                              <PaginationLink
                                onClick={() => !loadingTabla && setPaginaActual(i + 1)}
                                isActive={paginaActual === i + 1}
                                className={loadingTabla ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              >
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => {
                                if (!loadingTabla && paginaActual < totalPaginas) {
                                  setPaginaActual(paginaActual + 1);
                                }
                              }}
                              className={paginaActual >= totalPaginas || loadingTabla ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="tarjetas" className="space-y-4">
                    <div className="relative">
                      {loadingTabla && (
                        <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-lg">
                          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mb-2" />
                          <span className="text-sm text-blue-600">Actualizando página...</span>
                        </div>
                      )}
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${loadingTabla ? 'opacity-50 pointer-events-none' : ''}`}>
                      {facturasPaginadas.map(factura => (
                        <Card key={factura.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{factura.numero_factura || factura.numero}</h3>
                                <p className="text-sm text-gray-500">{new Date(factura.fecha_emision || factura.fecha).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="font-medium">{factura.cliente_nombre || factura.cliente}</p>
                              <p className="text-sm text-gray-500">{factura.empresa_nombre || factura.empresa}</p>
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
                                <p className="font-semibold text-blue-600">€{(factura.total || 0).toLocaleString()}</p>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2 pt-2 flex-wrap">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="flex-1 min-w-[100px]"
                                    onClick={() => handleVerFactura(factura.id)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Detalle de Factura {factura.numero_factura || factura.numero}</DialogTitle>
                                    <DialogDescription>
                                      Ver la información completa y detalle de productos de la factura seleccionada.
                                    </DialogDescription>
                                  </DialogHeader>
                                  {facturaDetalle && facturaDetalle.id === factura.id && (
                                    <DetalleFactura 
                                      factura={facturaDetalle} 
                                      onDescargarPDF={() => handleDescargarPDF(facturaDetalle)}
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex-1 min-w-[100px]"
                                onClick={() => handleDescargarPDF(factura)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                PDF
                              </Button>
                              {puedeDividirFactura(factura) && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="flex-1 min-w-[120px] border-purple-300 text-purple-700 hover:bg-purple-50"
                                  onClick={() => handleDividirFactura(factura.id)}
                                  disabled={dividiendoFactura === factura.id}
                                >
                                  {dividiendoFactura === factura.id ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                      Dividiendo...
                                    </>
                                  ) : (
                                    <>
                                      <Split className="w-4 h-4 mr-2" />
                                      Dividir
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Historial de Proformas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="w-5 h-5 text-purple-600" />
                    <span>Historial de Proformas</span>
                  </CardTitle>
                  <Tabs value={vistaActualProformas} onValueChange={(value) => setVistaActualProformas(value as 'tabla' | 'tarjetas')}>
                    <TabsList>
                      <TabsTrigger value="tabla">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Tabla
                      </TabsTrigger>
                      <TabsTrigger value="tarjetas">Tarjetas</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
                  <Input
                    placeholder="Buscar por número o cliente..."
                    value={busquedaProformas}
                    onChange={(e) => setBusquedaProformas(e.target.value)}
                  />

                  <Select value={filtroEmpresaProformas} onValueChange={setFiltroEmpresaProformas}>
                    <SelectTrigger>
                      <SelectValue placeholder="Empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las Empresas</SelectItem>
                      {empresasDisponibles.map(empresa => (
                        <SelectItem key={empresa.id} value={empresa.id.toString()}>
                          {empresa.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filtroEstadoProformas} onValueChange={setFiltroEstadoProformas}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los Estados</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="proformado">Proformado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedMonthProformas} onValueChange={(value) => { setSelectedMonthProformas(value); setPaginaProformas(1); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map(month => (
                        <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedYearProformas} onValueChange={(value) => { setSelectedYearProformas(value); setPaginaProformas(1); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      {añosDisponibles.map(año => (
                        <SelectItem key={año} value={año}>{año}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={vistaActualProformas}>
                  <TabsContent value="tabla" className="space-y-4">
                    {errorProformas && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <span>{errorProformas}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => cargarProformas()}
                            className="ml-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    {!errorProformas && proformasParaMostrar.length === 0 && !loadingProformas && (
                      <p className="text-center py-6 text-gray-500">
                        No hay proformas para mostrar con los filtros seleccionados.
                      </p>
                    )}

                    {proformasParaMostrar.length > 0 && (
                  <div className="relative">
                    {loadingTablaProformas && (
                      <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-lg">
                        <RefreshCw className="w-6 h-6 text-purple-500 animate-spin mb-2" />
                        <span className="text-sm text-purple-600">Actualizando proformas...</span>
                      </div>
                    )}
                    <div className={`${loadingTablaProformas ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="px-2 py-2 text-sm">Proforma</TableHead>
                              <TableHead className="px-2 py-2 text-sm">Fecha</TableHead>
                              <TableHead className="px-2 py-2 text-sm">Cliente / Empresa</TableHead>
                              <TableHead className="px-2 py-2 text-sm text-right">Subtotal</TableHead>
                              <TableHead className="px-2 py-2 text-sm text-right">Total</TableHead>
                              <TableHead className="px-2 py-2 text-sm text-center">Estado</TableHead>
                              <TableHead className="px-2 py-2 text-sm text-center">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {proformasParaMostrar.map((proforma) => (
                              <TableRow key={proforma.id} className="align-top">
                                <TableCell className="px-2 py-2 whitespace-nowrap">
                                  <p className="font-semibold text-sm">{proforma.numero_proforma}</p>
                                </TableCell>
                                <TableCell className="px-2 py-2 whitespace-nowrap">
                                  <p className="text-sm">{new Date(proforma.fecha_emision).toLocaleDateString()}</p>
                                </TableCell>
                                <TableCell className="px-2 py-2 break-words">
                                  <div className="font-medium leading-tight text-sm">
                                    {proforma.cliente_nombre || 'Cliente no especificado'}
                                  </div>
                                  <div className="text-muted-foreground text-xs leading-tight">
                                    {proforma.empresa_nombre || 'Empresa no especificada'}
                                  </div>
                                </TableCell>
                                <TableCell className="px-2 py-2 text-right whitespace-nowrap">
                                  <p className="text-sm">€{(proforma.subtotal || 0).toLocaleString()}</p>
                                </TableCell>
                                <TableCell className="px-2 py-2 text-right font-semibold text-purple-600 whitespace-nowrap">
                                  <p className="text-sm">€{(proforma.total || 0).toLocaleString()}</p>
                                </TableCell>
                                <TableCell className="px-2 py-2 text-center whitespace-nowrap">
                                  {getEstadoBadge(proforma.estado || 'pendiente')}
                                </TableCell>
                                <TableCell className="px-2 py-2 text-center">
                                  <div className="inline-flex gap-1">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="w-8 h-8 p-0"
                                          onClick={() => handleVerProforma(proforma.id)}
                                        >
                                          <Eye className="size-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="historial-proforma-modal">
                                        <DialogHeader>
                                          <DialogTitle>Detalle de Proforma {proforma.numero_proforma}</DialogTitle>
                                          <DialogDescription>
                                            Información completa de la proforma seleccionada.
                                          </DialogDescription>
                                        </DialogHeader>
                                        {loadingProformaDetalle && proformaDetalleId === proforma.id && (
                                          <div className="historial-proforma-loading">
                                            <RefreshCw />
                                          </div>
                                        )}
                                        {!loadingProformaDetalle && proformaDetalle && proformaDetalleId === proforma.id && (
                                          <DetalleProforma 
                                            proforma={proformaDetalle} 
                                            onDescargarPDF={() => handleDescargarProformaPDF(proformaDetalle)}
                                          />
                                        )}
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      variant="outline" 
                                      size="sm"
                                      className="w-8 h-8 p-0"
                                      onClick={() => handleDescargarProformaPDF(proforma)}
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                    {puedeDividirProforma(proforma) && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="w-8 h-8 p-0 border-purple-300 text-purple-700 hover:bg-purple-50"
                                        onClick={() => handleDividirProforma(proforma.id)}
                                        disabled={dividiendoProforma === proforma.id}
                                        title="Dividir en proformas individuales"
                                      >
                                        {dividiendoProforma === proforma.id ? (
                                          <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Split className="w-4 h-4" />
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {totalPaginasProformas > 1 && (
                        <div className="flex justify-center mt-6">
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious 
                                  onClick={() => !loadingTablaProformas && setPaginaProformas(Math.max(1, paginaProformas - 1))}
                                  className={paginaProformas === 1 || loadingTablaProformas ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                              </PaginationItem>
                              
                              {[...Array(totalPaginasProformas)].map((_, i) => (
                                <PaginationItem key={i + 1}>
                                  <PaginationLink
                                    onClick={() => !loadingTablaProformas && setPaginaProformas(i + 1)}
                                    isActive={paginaProformas === i + 1}
                                    className={loadingTablaProformas ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                  >
                                    {i + 1}
                                  </PaginationLink>
                                </PaginationItem>
                              ))}
                              
                              <PaginationItem>
                                <PaginationNext 
                                  onClick={() => {
                                    if (!loadingTablaProformas && paginaProformas < totalPaginasProformas) {
                                      setPaginaProformas(paginaProformas + 1);
                                    }
                                  }}
                                  className={paginaProformas >= totalPaginasProformas || loadingTablaProformas ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                    {loadingProformas && proformasParaMostrar.length === 0 && (
                      <div className="flex items-center justify-center py-10">
                        <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="tarjetas" className="space-y-4">
                    {errorProformas && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <span>{errorProformas}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => cargarProformas()}
                            className="ml-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    {!errorProformas && proformasParaMostrar.length === 0 && !loadingProformas && (
                      <p className="text-center py-6 text-gray-500">
                        No hay proformas para mostrar con los filtros seleccionados.
                      </p>
                    )}

                    {proformasParaMostrar.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {proformasParaMostrar.map((proforma) => (
                          <Card key={proforma.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-purple-600">
                                  {proforma.numero_proforma}
                                </CardTitle>
                                {getEstadoBadge(proforma.estado || 'pendiente')}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(proforma.fecha_emision).toLocaleDateString()}
                              </p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {proforma.cliente_nombre || 'Cliente no especificado'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {proforma.empresa_nombre || 'Empresa no especificada'}
                                </p>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t">
                                <span className="text-sm text-gray-600">Total:</span>
                                <span className="text-lg font-bold text-purple-600">
                                  €{(proforma.total || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex gap-2 pt-2 flex-wrap">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="flex-1 min-w-[100px]"
                                      onClick={() => handleVerProforma(proforma.id)}
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Ver
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="historial-proforma-modal">
                                    <DialogHeader>
                                      <DialogTitle>Detalle de Proforma {proforma.numero_proforma}</DialogTitle>
                                      <DialogDescription>
                                        Información completa de la proforma seleccionada.
                                      </DialogDescription>
                                    </DialogHeader>
                                    {loadingProformaDetalle && proformaDetalleId === proforma.id && (
                                      <div className="historial-proforma-loading">
                                        <RefreshCw />
                                      </div>
                                    )}
                                    {!loadingProformaDetalle && proformaDetalle && proformaDetalleId === proforma.id && (
                                      <DetalleProforma 
                                        proforma={proformaDetalle} 
                                        onDescargarPDF={() => handleDescargarProformaPDF(proformaDetalle)}
                                      />
                                    )}
                                  </DialogContent>
                                </Dialog>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="flex-1 min-w-[100px]"
                                  onClick={() => handleDescargarProformaPDF(proforma)}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  PDF
                                </Button>
                                {puedeDividirProforma(proforma) && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="flex-1 min-w-[120px] border-purple-300 text-purple-700 hover:bg-purple-50"
                                    onClick={() => handleDividirProforma(proforma.id)}
                                    disabled={dividiendoProforma === proforma.id}
                                  >
                                    {dividiendoProforma === proforma.id ? (
                                      <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Dividiendo...
                                      </>
                                    ) : (
                                      <>
                                        <Split className="w-4 h-4 mr-2" />
                                        Dividir
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {loadingProformas && proformasParaMostrar.length === 0 && (
                      <div className="flex items-center justify-center py-10">
                        <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resumen del periodo */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <CalendarDays className="w-5 h-5" />
                    <span>Resumen seleccionado</span>
                  </span>
                  <span className="text-sm text-blue-700 font-semibold">
                    {mesSeleccionadoLabel} · {selectedYear}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Facturas:</span>
                  <span className="font-semibold">{resumenSeleccionado.facturas || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ingresos:</span>
                  <span className="font-semibold text-blue-600">€{(resumenSeleccionado.ingresos || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Promedio:</span>
                  <span className="font-semibold">€{(resumenSeleccionado.promedio || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Acciones Rápidas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onNavigate('facturas')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Factura
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleReporteMensual}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Reporte Mensual
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleExportarExcel}
                >
                  <Download className="w-4 h-4 mr-2" />
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
            <p><span className="font-medium">Número:</span> {factura.numero_factura || factura.numero}</p>
            <p><span className="font-medium">Fecha:</span> {new Date(factura.fecha_emision || factura.fecha).toLocaleDateString()}</p>
            <p><span className="font-medium">Estado:</span> {factura.estado}</p>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Cliente</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Nombre:</span> {factura.cliente_nombre || factura.cliente}</p>
            <p><span className="font-medium">Empresa:</span> {factura.empresa_nombre || factura.empresa}</p>
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
          {(factura.productos || factura.detalles || []).map((producto: any, index: number) => {
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
                <TableCell className="text-center text-sm">{producto.cantidad || 1}</TableCell>
                <TableCell className="text-right text-sm">€{(producto.precio_unitario || producto.precio || 0).toLocaleString()}</TableCell>
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
            <span>€{(factura.igic || factura.impuesto || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span className="text-blue-600">€{(factura.total || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

       <div className="flex justify-center">
         <Button 
           className="w-full max-w-xs"
           onClick={() => onDescargarPDF(factura)}
         >
           <Download className="w-4 h-4 mr-2" />
           Descargar PDF
         </Button>
       </div>
    </div>
  );
}

interface DetalleProformaProps {
  proforma: Proforma;
  onDescargarPDF: (proforma: Proforma) => void;
}

function DetalleProforma({ proforma, onDescargarPDF }: DetalleProformaProps) {
  const productos = proforma.detalles || [];

  return (
    <div className="historial-proforma-modal-body">
      <div className="historial-proforma-info-section">
        <div className="historial-proforma-info-card">
          <h3>Información de la Proforma</h3>
          <p><span style={{ fontWeight: 600 }}>Número:</span> {proforma.numero_proforma}</p>
          <p><span style={{ fontWeight: 600 }}>Fecha:</span> {new Date(proforma.fecha_emision).toLocaleDateString()}</p>
          <p><span style={{ fontWeight: 600 }}>Estado:</span> {proforma.estado}</p>
        </div>
        
        <div className="historial-proforma-info-card">
          <h3>Cliente</h3>
          <p><span style={{ fontWeight: 600 }}>Nombre:</span> {proforma.cliente_nombre || 'N/A'}</p>
          <p><span style={{ fontWeight: 600 }}>CIF/NIF:</span> {proforma.cliente_identificacion || 'N/A'}</p>
          <p><span style={{ fontWeight: 600 }}>Dirección:</span> {proforma.cliente_direccion || 'N/A'}</p>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.35rem', color: '#374151' }}>Conceptos</h3>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead style={{ background: '#f3e8ff' }}>
              <tr>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#581c87', fontSize: '0.8rem', textTransform: 'uppercase' }}>Descripción</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#581c87', fontSize: '0.8rem', textTransform: 'uppercase' }}>Cant.</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#581c87', fontSize: '0.8rem', textTransform: 'uppercase' }}>Precio</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#581c87', fontSize: '0.8rem', textTransform: 'uppercase' }}>IGIC</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#581c87', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto, index) => (
                <tr key={index} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.5rem 0.75rem', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>{producto.descripcion || 'Producto sin descripción'}</div>
                    {producto.matricula && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.2rem' }}>
                        {producto.marca || ''} {producto.modelo || ''} · {producto.matricula}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', verticalAlign: 'middle', fontSize: '0.875rem' }}>{producto.cantidad || 1}</td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', verticalAlign: 'middle', fontSize: '0.875rem' }}>€{((producto.precio_unitario || producto.precio || 0)).toLocaleString()}</td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', verticalAlign: 'middle', fontSize: '0.875rem' }}>€{(producto.igic || producto.impuesto || 0).toLocaleString()}</td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', verticalAlign: 'middle', fontSize: '0.875rem', fontWeight: 600, color: '#7c3aed' }}>
                    €{(producto.total || (producto.precio_unitario || 0) * (producto.cantidad || 1)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
        <div style={{ background: '#f3e8ff', padding: '0.5rem 0.85rem', borderRadius: '0.375rem', border: '1px solid #c4b5fd', minWidth: '260px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.9rem' }}>
            <span style={{ color: '#6b7280' }}>Subtotal:</span>
            <span style={{ fontWeight: 500 }}>€{(proforma.subtotal || 0).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', fontSize: '0.9rem' }}>
            <span style={{ color: '#6b7280' }}>IGIC:</span>
            <span style={{ fontWeight: 500 }}>€{(proforma.igic || 0).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', marginTop: '0.25rem', borderTop: '2px solid #a78bfa', fontSize: '1.1rem', fontWeight: 700, color: '#7c3aed' }}>
            <span>Total:</span>
            <span>€{(proforma.total || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
        <Button 
          className="w-full max-w-xs"
          onClick={() => onDescargarPDF(proforma)}
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar PDF
        </Button>
      </div>
    </div>
  );
}

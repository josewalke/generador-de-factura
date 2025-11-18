import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Screen } from '../App';
import { BackendStatus } from './BackendStatus';
import { clienteService } from '../services/clienteService';
import { cocheService } from '../services/cocheService';
import { empresaService } from '../services/empresaService';
import { statsService } from '../services/statsService';
import { SelectorCertificado } from './ui/SelectorCertificado';
import { CertificadoDigital } from '../services/certificadoService';
import { RefreshCw, Trash2, Users, Car, Building2, BarChart3, Zap } from 'lucide-react';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
}

interface DashboardStats {
  totalClientes: number;
  totalCoches: number;
  totalFacturas: number;
  totalEmpresas: number;
  ingresosMes: number;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [connectionStatus] = React.useState<'connecting' | 'connected' | 'disconnected'>('connected');
  const [stats, setStats] = React.useState<DashboardStats>({
    totalClientes: 0,
    totalCoches: 0,
    totalFacturas: 0,
    totalEmpresas: 0,
    ingresosMes: 0
  });
  const [loading, setLoading] = React.useState(true);
  
  // Estados para los modales
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [mostrarModalCoche, setMostrarModalCoche] = useState(false);
  const [mostrarModalEmpresa, setMostrarModalEmpresa] = useState(false);

  // Cargar estadísticas reales de la API
  React.useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        
        const resumen = await statsService.getResumen();
        
        setStats(resumen);
        
        console.log('📊 Estadísticas del dashboard cargadas:', resumen);
        
      } catch (error) {
        console.error('❌ Error cargando estadísticas del dashboard:', error);
        // Mantener valores por defecto en caso de error
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const clearCache = () => {
    try {
      // Limpiar localStorage
      localStorage.clear();
      
      // Limpiar sessionStorage
      sessionStorage.clear();
      
      // Limpiar caché del navegador
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
          });
        });
      }
      
      // Limpiar IndexedDB
      if ('indexedDB' in window) {
        indexedDB.databases().then(databases => {
          databases.forEach(db => {
            indexedDB.deleteDatabase(db.name);
          });
        });
      }
      
      alert('Caché limpiado. Recarga la página (Ctrl+F5) para ver los cambios.');
    } catch (error) {
      console.error('Error limpiando caché:', error);
      alert('Error al limpiar el caché');
    }
  };

  const refreshStats = async () => {
    try {
      setLoading(true);
      
      const resumen = await statsService.getResumen();
      setStats(resumen);
      
      console.log('🔄 Estadísticas actualizadas:', resumen);
      
    } catch (error) {
      console.error('❌ Error actualizando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'disconnected': return 'Desconectado';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Telwagen</h1>
              <p className="text-gray-600 mt-1">Generador de Facturas</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={refreshStats}
                variant="outline" 
                size="sm"
                disabled={loading}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button 
                onClick={clearCache}
                variant="outline" 
                size="sm"
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar Caché
              </Button>
              <BackendStatus />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Alerts Section */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription>
                Certificado digital caduca en 30 días. Renovar antes del 15 de octubre.
              </AlertDescription>
            </Alert>

            {/* Featured Facturas Section */}
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">🧾</span>
                  <span>Facturas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Genera y gestiona facturas para tus clientes</p>
                <Button 
                  onClick={() => onNavigate('facturas')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                >
                  Generar Nueva Factura
                </Button>
              </CardContent>
            </Card>

            {/* Secondary Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('clientes')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Clientes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Gestiona tu base de clientes</p>
                  <p className="mt-2 font-semibold text-blue-600">
                    {loading ? 'Cargando...' : `${stats.totalClientes} clientes`}
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('coches')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <Car className="w-5 h-5" />
                    <span>Coches</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Inventario de vehículos</p>
                  <p className="mt-2 font-semibold text-blue-600">
                    {loading ? 'Cargando...' : `${stats.totalCoches} vehículos`}
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('empresas')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>Empresas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Configuración de empresas</p>
                  <p className="mt-2 font-semibold text-blue-600">
                    {loading ? 'Cargando...' : `${stats.totalEmpresas} empresas`}
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('historial')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Historial</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Facturas anteriores</p>
                  <p className="mt-2 font-semibold text-blue-600">
                    {loading ? 'Cargando...' : `${stats.totalFacturas} facturas`}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Estadísticas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Clientes</span>
                  <Badge variant="secondary">{loading ? '...' : stats.totalClientes}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Coches</span>
                  <Badge variant="secondary">{loading ? '...' : stats.totalCoches}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Facturas</span>
                  <Badge variant="secondary">{loading ? '...' : stats.totalFacturas}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Empresas</span>
                  <Badge variant="secondary">{loading ? '...' : stats.totalEmpresas}</Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ingresos del Mes</span>
                    <span className="font-bold text-blue-600">
                      {loading ? '...' : stats.ingresosMes.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Acciones Rápidas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog open={mostrarModalCliente} onOpenChange={setMostrarModalCliente}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <span className="mr-2">👤</span>
                      Nuevo Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Nuevo Cliente</DialogTitle>
                      <DialogDescription>
                        Agrega un nuevo cliente al sistema.
                      </DialogDescription>
                    </DialogHeader>
                    <FormularioCliente 
                      onSubmit={async (clienteData) => {
                        try {
                          await clienteService.create(clienteData);
                          setMostrarModalCliente(false);
                          refreshStats(); // Actualizar estadísticas
                        } catch (error) {
                          console.error('Error creando cliente:', error);
                          alert('Error al crear el cliente');
                        }
                      }}
                      onCancel={() => setMostrarModalCliente(false)}
                    />
                  </DialogContent>
                </Dialog>

                <Dialog open={mostrarModalCoche} onOpenChange={setMostrarModalCoche}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <Car className="w-4 h-4 mr-2" />
                      Nuevo Coche
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Nuevo Coche</DialogTitle>
                      <DialogDescription>
                        Agrega un nuevo vehículo al inventario.
                      </DialogDescription>
                    </DialogHeader>
                    <FormularioCoche 
                      onSubmit={async (cocheData) => {
                        try {
                          await cocheService.create(cocheData);
                          setMostrarModalCoche(false);
                          refreshStats(); // Actualizar estadísticas
                        } catch (error) {
                          console.error('Error creando coche:', error);
                          alert('Error al crear el coche');
                        }
                      }}
                      onCancel={() => setMostrarModalCoche(false)}
                    />
                  </DialogContent>
                </Dialog>

                <Dialog open={mostrarModalEmpresa} onOpenChange={setMostrarModalEmpresa}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Nueva Empresa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Nueva Empresa</DialogTitle>
                      <DialogDescription>
                        Agrega una nueva empresa al sistema.
                      </DialogDescription>
                    </DialogHeader>
                    <FormularioEmpresa 
                      onSubmit={async (empresaData) => {
                        try {
                          await empresaService.create(empresaData);
                          setMostrarModalEmpresa(false);
                          refreshStats(); // Actualizar estadísticas
                        } catch (error) {
                          console.error('Error creando empresa:', error);
                          alert('Error al crear la empresa');
                        }
                      }}
                      onCancel={() => setMostrarModalEmpresa(false)}
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de formulario para cliente
interface FormularioClienteProps {
  onSubmit: (clienteData: any) => void;
  onCancel: () => void;
}

function FormularioCliente({ onSubmit, onCancel }: FormularioClienteProps) {
  const [nombre, setNombre] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      nombre,
      identificacion,
      email,
      telefono,
      direccion
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Identificación</label>
        <input
          type="text"
          value={identificacion}
          onChange={(e) => setIdentificacion(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Teléfono</label>
        <input
          type="text"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Dirección</label>
        <textarea
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
        />
      </div>
      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          Crear Cliente
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

// Componente de formulario para coche
interface FormularioCocheProps {
  onSubmit: (cocheData: any) => void;
  onCancel: () => void;
}

function FormularioCoche({ onSubmit, onCancel }: FormularioCocheProps) {
  const [matricula, setMatricula] = useState('');
  const [chasis, setChasis] = useState('');
  const [color, setColor] = useState('');
  const [kms, setKms] = useState(0);
  const [modelo, setModelo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      matricula,
      chasis,
      color,
      kms,
      modelo
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Matrícula</label>
        <input
          type="text"
          value={matricula}
          onChange={(e) => setMatricula(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Chasis</label>
        <input
          type="text"
          value={chasis}
          onChange={(e) => setChasis(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Color</label>
        <input
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Kilómetros</label>
        <input
          type="number"
          value={kms}
          onChange={(e) => setKms(Number(e.target.value) || 0)}
          className="w-full px-3 py-2 border rounded-md"
          min="0"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Modelo</label>
        <input
          type="text"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          Crear Coche
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

// Componente de formulario para empresa
interface FormularioEmpresaProps {
  onSubmit: (empresaData: any) => void;
  onCancel: () => void;
}

function FormularioEmpresa({ onSubmit, onCancel }: FormularioEmpresaProps) {
  const [nombre, setNombre] = useState('');
  const [cif, setCif] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [certificadoDigital, setCertificadoDigital] = useState(false);
  const [certificadoAsignado, setCertificadoAsignado] = useState<CertificadoDigital | null>(null);
  const [mostrarSelectorCertificado, setMostrarSelectorCertificado] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determinar el certificado a enviar
    let certificadoAEnviar = null;
    if (certificadoAsignado?.SerialNumber) {
      certificadoAEnviar = certificadoAsignado.SerialNumber;
    }
    
    onSubmit({
      nombre,
      cif,
      direccion,
      telefono,
      email,
      firmaDigitalThumbprint: certificadoAEnviar
    });
  };

  const handleSeleccionarCertificado = (certificado: CertificadoDigital | null) => {
    setCertificadoAsignado(certificado);
    setMostrarSelectorCertificado(false);
    if (certificado) {
      setCertificadoDigital(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre de la Empresa</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">CIF</label>
        <input
          type="text"
          value={cif}
          onChange={(e) => setCif(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Dirección</label>
        <textarea
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Teléfono</label>
        <input
          type="text"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="certificadoDigital"
            checked={certificadoDigital}
            onChange={(e) => setCertificadoDigital(e.target.checked)}
          />
          <label htmlFor="certificadoDigital">Certificado Digital disponible</label>
        </div>

        {certificadoDigital && (
          <div className="space-y-2">
            <label className="block text-sm font-medium mb-1">Certificado Asignado</label>
            {certificadoAsignado ? (
              <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-800">{certificadoAsignado.CommonName}</p>
                    {certificadoAsignado.CIF && (
                      <p className="text-sm text-blue-600">CIF: {certificadoAsignado.CIF}</p>
                    )}
                    <p className="text-xs text-blue-600">
                      Válido hasta: {certificadoAsignado.NotAfter ? new Date(certificadoAsignado.NotAfter).toLocaleDateString('es-ES') : 'N/A'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMostrarSelectorCertificado(true)}
                  >
                    Cambiar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setMostrarSelectorCertificado(true)}
                className="w-full"
              >
                Seleccionar Certificado
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          Crear Empresa
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      {/* Diálogo para seleccionar certificado */}
      <Dialog open={mostrarSelectorCertificado} onOpenChange={setMostrarSelectorCertificado}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Seleccionar Certificado Digital</DialogTitle>
            <DialogDescription>
              Elige el certificado digital que se asociará con esta empresa.
            </DialogDescription>
          </DialogHeader>
          <SelectorCertificado
            certificadoSeleccionado={certificadoAsignado?.SerialNumber}
            onSeleccionarCertificado={handleSeleccionarCertificado}
            onCancelar={() => setMostrarSelectorCertificado(false)}
          />
        </DialogContent>
      </Dialog>
    </form>
  );
}

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { SelectorCertificado } from '../ui/SelectorCertificado';
import { Screen } from '../../App';
import { CertificadoDigital } from '../../services/certificadoService';
import { excelService } from '../../services/excelService';
import { Download, Shield } from 'lucide-react';
import { useEmpresas } from '../../hooks/useEmpresas';
import { Empresa } from '../../services/empresaService';

interface EmpresasScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function EmpresasScreen({ onNavigate }: EmpresasScreenProps) {
  const [busqueda, setBusqueda] = useState('');
  const [empresaEditing, setEmpresaEditing] = useState<Empresa | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);

  // Usar hook para obtener datos reales
  const { 
    empresas, 
    loading, 
    error, 
    createEmpresa, 
    updateEmpresa, 
    deleteEmpresa 
  } = useEmpresas();

  const empresasFiltradas = empresas.filter(empresa => {
    // Si no hay búsqueda, mostrar todas las empresas
    if (!busqueda || busqueda.trim() === '') {
      return true;
    }
    
    return empresa.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      empresa.cif?.toLowerCase().includes(busqueda.toLowerCase()) ||
      empresa.email?.toLowerCase().includes(busqueda.toLowerCase());
  });

  const stats = {
    total: empresas.length,
    conCertificado: empresas.filter(e => e.certificado_thumbprint && e.certificado_thumbprint.trim() !== '').length,
    sinCertificado: empresas.filter(e => !e.certificado_thumbprint || e.certificado_thumbprint.trim() === '').length
  };

  const agregarEmpresa = async (nuevaEmpresa: Omit<Empresa, 'id' | 'fecha_creacion' | 'activo'>) => {
    try {
      await createEmpresa({
        ...nuevaEmpresa,
        activo: 1
      });
      setMostrarFormulario(false);
    } catch (error) {
      console.error('Error agregando empresa:', error);
      alert('Error al agregar la empresa');
    }
  };

  const editarEmpresa = async (empresaActualizada: Empresa) => {
    try {
      await updateEmpresa(empresaActualizada.id, empresaActualizada);
      // Cerrar todos los modales después de editar exitosamente
      setEmpresaEditing(null);
      setMostrarFormulario(false);
      setMostrarModalEdicion(false);
    } catch (error) {
      console.error('Error editando empresa:', error);
      alert('Error al editar la empresa');
    }
  };

  const eliminarEmpresa = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta empresa?')) {
      try {
        await deleteEmpresa(id);
      } catch (error) {
        console.error('Error eliminando empresa:', error);
        alert('Error al eliminar la empresa');
      }
    }
  };

  const handleExportarEmpresas = () => {
    try {
      excelService.exportEmpresas(empresas, {
        filename: 'empresas',
        sheetName: 'Empresas'
      });
    } catch (error) {
      console.error('Error al exportar empresas:', error);
    }
  };

  const handleGestionarCertificados = () => {
    onNavigate('certificados');
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
                  <span className="text-2xl">🏢</span>
                  <span>Gestión de Empresas</span>
                </h1>
                <p className="text-gray-600">Configuración corporativa</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <span className="text-2xl">🏢</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Empresas</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <span className="text-2xl">🔐</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Con Certificado</p>
                      <p className="text-2xl font-bold text-green-600">{stats.conCertificado}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sin Certificado</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.sinCertificado}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Empresas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-lg">🔍</span>
                    <span>Directorio de Empresas</span>
                  </CardTitle>
                  <Dialog open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <span className="mr-2">➕</span>
                        Nueva Empresa
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Agregar Nueva Empresa</DialogTitle>
                        <DialogDescription>
                          Completa los datos básicos de la empresa.
                        </DialogDescription>
                      </DialogHeader>
                      <FormularioEmpresa 
                        onSubmit={agregarEmpresa}
                        onCancel={() => setMostrarFormulario(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="mt-4">
                  <Input
                    placeholder="Buscar por nombre, CIF o email..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow key="header">
                      <TableHead>Empresa</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Certificado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow key="loading">
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span>Cargando empresas...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow key="error">
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="text-red-600">
                            <p>❌ Error cargando empresas: {error}</p>
                            <Button 
                              onClick={() => window.location.reload()} 
                              variant="outline" 
                              className="mt-2"
                            >
                              Reintentar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : empresasFiltradas.length === 0 ? (
                      <TableRow key="empty">
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="text-gray-500">
                            <p>📭 No se encontraron empresas</p>
                            {busqueda && (
                              <p className="text-sm mt-1">
                                No hay resultados para "{busqueda}"
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      empresasFiltradas.map(empresa => (
                        <TableRow key={empresa.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold tracking-wide">{empresa.nombre}</p>
                            <p className="text-sm text-gray-500">CIF: {empresa.cif}</p>
                            <p className="text-sm text-gray-500">{empresa.direccion}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{empresa.email}</p>
                            <p className="text-sm text-gray-500">{empresa.telefono}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={empresa.certificado_thumbprint && empresa.certificado_thumbprint.trim() !== '' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {empresa.certificado_thumbprint && empresa.certificado_thumbprint.trim() !== '' ? '🔐 Sí' : '❌ No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog open={mostrarModalEdicion} onOpenChange={setMostrarModalEdicion}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setEmpresaEditing(empresa);
                                    setMostrarModalEdicion(true);
                                  }}
                                >
                                  ✏️
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Editar Empresa</DialogTitle>
                                  <DialogDescription>
                                    Modifica los datos de la empresa seleccionada.
                                  </DialogDescription>
                                </DialogHeader>
                                {empresaEditing && (
                                  <FormularioEmpresa 
                                    empresa={empresaEditing}
                                    onSubmit={editarEmpresa}
                                    onCancel={() => {
                                      setEmpresaEditing(null);
                                      setMostrarModalEdicion(false);
                                    }}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => eliminarEmpresa(empresa.id)}
                            >
                              🗑️
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Removed Empresa Principal card as requested */}
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
                  onClick={() => setMostrarFormulario(true)}
                >
                  <span className="mr-2">🏢</span>
                  Nueva Empresa
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleGestionarCertificados}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Gestionar Certificados
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleExportarEmpresas}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Listado
                </Button>
              </CardContent>
            </Card>

            {/* Información */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-lg">ℹ️</span>
                  <span>Información</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>Los certificados digitales son necesarios para la facturación electrónica.</p>
                <p>Asegúrate de mantener actualizados los datos de contacto de cada empresa.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FormularioEmpresaProps {
  empresa?: Empresa;
  onSubmit: (empresa: any) => void;
  onCancel: () => void;
}

function FormularioEmpresa({ empresa, onSubmit, onCancel }: FormularioEmpresaProps) {
  const [nombre, setNombre] = useState(empresa?.nombre || '');
  const [cif, setCif] = useState(empresa?.cif || '');
  const [direccion, setDireccion] = useState(empresa?.direccion || '');
  const [telefono, setTelefono] = useState(empresa?.telefono || '');
  const [email, setEmail] = useState(empresa?.email || '');
  const [certificadoDigital, setCertificadoDigital] = useState(!!empresa?.certificado_thumbprint);
  const [certificadoAsignado, setCertificadoAsignado] = useState<CertificadoDigital | null>(null);
  const [mostrarSelectorCertificado, setMostrarSelectorCertificado] = useState(false);

  // Efecto para cargar el certificado existente cuando se abre el formulario
  useEffect(() => {
    if (empresa?.certificado_thumbprint) {
      // Si la empresa ya tiene un certificado, crear un objeto CertificadoDigital simulado
      const certificadoExistente: CertificadoDigital = {
        CommonName: empresa.nombre || 'Certificado existente',
        Subject: `Certificado existente para ${empresa.nombre}`,
        CIF: empresa.cif || '',
        IsValid: true,
        NotBefore: new Date().toISOString(),
        NotAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año desde ahora
        SerialNumber: empresa.certificado_thumbprint,
        Thumbprint: empresa.certificado_thumbprint,
        Issuer: 'Certificado existente',
        Algorithm: 'RSA-2048',
        Hash: 'SHA-256',
        Type: 'existing'
      };
      setCertificadoAsignado(certificadoExistente);
      setCertificadoDigital(true);
    }
  }, [empresa]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determinar el certificado a enviar: el existente o el nuevo seleccionado
    let certificadoAEnviar = null;
    if (certificadoAsignado?.SerialNumber) {
      certificadoAEnviar = certificadoAsignado.SerialNumber;
    } else if (empresa?.certificado_thumbprint) {
      // Si no hay certificado nuevo pero hay uno existente, mantener el existente
      certificadoAEnviar = empresa.certificado_thumbprint;
    }
    
    const empresaData = {
      ...(empresa ? { id: empresa.id } : {}),
      nombre,
      cif,
      direccion,
      telefono,
      email,
      firmaDigitalThumbprint: certificadoAEnviar
    };
    onSubmit(empresaData);
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
        <Label htmlFor="nombre">Nombre de la Empresa</Label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="cif">CIF</Label>
        <Input
          id="cif"
          value={cif}
          onChange={(e) => setCif(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="direccion">Dirección</Label>
        <Textarea
          id="direccion"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="certificadoDigital"
            checked={certificadoDigital}
            onChange={(e) => setCertificadoDigital(e.target.checked)}
          />
          <Label htmlFor="certificadoDigital">Certificado Digital disponible</Label>
        </div>

        {certificadoDigital && (
          <div className="space-y-2">
            <Label>Certificado Asignado</Label>
            {certificadoAsignado ? (
              <div className={`p-3 border rounded-lg ${certificadoAsignado.Type === 'existing' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-green-800">{certificadoAsignado.CommonName}</p>
                      {certificadoAsignado.Type === 'existing' && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Existente</span>
                      )}
                    </div>
                    {certificadoAsignado.CIF && (
                      <p className="text-sm text-green-600">CIF: {certificadoAsignado.CIF}</p>
                    )}
                    <p className="text-xs text-green-600">
                      {certificadoAsignado.Type === 'existing' ? 'Certificado actual' : `Válido hasta: ${certificadoAsignado.NotAfter ? new Date(certificadoAsignado.NotAfter).toLocaleDateString('es-ES') : 'N/A'}`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMostrarSelectorCertificado(true)}
                  >
                    {certificadoAsignado.Type === 'existing' ? 'Cambiar' : 'Cambiar'}
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
          {empresa ? 'Actualizar' : 'Agregar'} Empresa
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

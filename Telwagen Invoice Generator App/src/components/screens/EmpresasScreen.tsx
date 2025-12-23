import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Screen } from '../../App';

interface EmpresasScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface Empresa {
  id: string;
  nombre: string;
  cif: string;
  direccion: string;
  email: string;
  telefono: string;
  certificadoDigital: boolean;
}

export function EmpresasScreen({ onNavigate }: EmpresasScreenProps) {
  const [busqueda, setBusqueda] = useState('');
  const [empresaEditing, setEmpresaEditing] = useState<Empresa | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Mock data
  const [empresas, setEmpresas] = useState<Empresa[]>([
    {
      id: '1',
      nombre: 'Telwagen Car Ibérica, S.L.',
      cif: 'B-93.289.585',
      direccion: 'Polígono Industrial de Arinaga, Parcela 15, 35118 Las Palmas',
      telefono: '+34 928 123 456',
      email: 'info@telwagen.com',
      certificadoDigital: true
    },
    {
      id: '2',
      nombre: 'Telwagen Tenerife Norte',
      cif: 'B-93.289.586',
      direccion: 'Zona Industrial La Esperanza, 38291 Santa Cruz de Tenerife',
      telefono: '+34 922 987 654',
      email: 'tenerife@telwagen.com',
      certificadoDigital: false
    }
  ]);

  const empresasFiltradas = empresas.filter(empresa =>
    empresa.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    empresa.cif.toLowerCase().includes(busqueda.toLowerCase()) ||
    empresa.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const stats = {
    total: empresas.length,
    conCertificado: empresas.filter(e => e.certificadoDigital).length,
    sinCertificado: empresas.filter(e => !e.certificadoDigital).length
  };

  const agregarEmpresa = (nuevaEmpresa: Omit<Empresa, 'id'>) => {
    const empresa: Empresa = {
      ...nuevaEmpresa,
      id: Date.now().toString()
    };
    setEmpresas([...empresas, empresa]);
    setMostrarFormulario(false);
  };

  const editarEmpresa = (empresaActualizada: Empresa) => {
    setEmpresas(empresas.map(e => 
      e.id === empresaActualizada.id ? empresaActualizada : e
    ));
    setEmpresaEditing(null);
  };

  const eliminarEmpresa = (id: string) => {
    setEmpresas(empresas.filter(e => e.id !== id));
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
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Certificado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empresasFiltradas.map(empresa => (
                      <TableRow key={empresa.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{empresa.nombre}</p>
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
                          <Badge className={empresa.certificadoDigital ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {empresa.certificadoDigital ? '🔐 Sí' : '❌ No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEmpresaEditing(empresa)}
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
                                    onCancel={() => setEmpresaEditing(null)}
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
                    ))}
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
                >
                  <span className="mr-2">🔐</span>
                  Gestionar Certificados
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <span className="mr-2">📄</span>
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
  const [certificadoDigital, setCertificadoDigital] = useState(empresa?.certificadoDigital ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const empresaData = {
      ...(empresa ? { id: empresa.id } : {}),
      nombre,
      cif,
      direccion,
      telefono,
      email,
      certificadoDigital
    };
    onSubmit(empresaData);
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

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="certificadoDigital"
          checked={certificadoDigital}
          onChange={(e) => setCertificadoDigital(e.target.checked)}
        />
        <Label htmlFor="certificadoDigital">Certificado Digital disponible</Label>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          {empresa ? 'Actualizar' : 'Agregar'} Empresa
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
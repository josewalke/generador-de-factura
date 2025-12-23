import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Screen } from '../../App';

interface ClientesScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface Cliente {
  id: string;
  nombreCompleto: string;
  identificacion: string;
  direccion: string;
  codigoPostal: string;
  telefono: string;
  email: string;
}

export function ClientesScreen({ onNavigate }: ClientesScreenProps) {
  const [busqueda, setBusqueda] = useState('');
  const [clienteEditing, setClienteEditing] = useState<Cliente | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Mock data
  const [clientes, setClientes] = useState<Cliente[]>([
    {
      id: '1',
      nombreCompleto: 'Juan Pérez García',
      direccion: 'Calle Principal 123, Las Palmas',
      identificacion: '12345678A',
      email: 'juan@email.com',
      telefono: '+34 928 123 456',
      codigoPostal: '35001'
    },
    {
      id: '2',
      nombreCompleto: 'María López Rodríguez',
      direccion: 'Avenida Central 456, Tenerife',
      identificacion: '87654321B',
      email: 'maria@email.com',
      telefono: '+34 922 987 654',
      codigoPostal: '38001'
    },
    {
      id: '3',
      nombreCompleto: 'Carlos Mendoza Silva',
      direccion: 'Plaza Mayor 789, Gran Canaria',
      identificacion: '11223344C',
      email: 'carlos@email.com',
      telefono: '+34 928 555 777',
      codigoPostal: '35002'
    },
    {
      id: '4',
      nombreCompleto: 'Ana Fernández Torres',
      direccion: 'Calle Comercial 321, Las Palmas',
      identificacion: '55667788D',
      email: 'ana@email.com',
      telefono: '+34 928 444 222',
      codigoPostal: '35003'
    }
  ]);

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.identificacion.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const agregarCliente = (nuevoCliente: Omit<Cliente, 'id'>) => {
    const cliente: Cliente = {
      ...nuevoCliente,
      id: Date.now().toString()
    };
    setClientes([...clientes, cliente]);
    setMostrarFormulario(false);
  };

  const editarCliente = (clienteActualizado: Cliente) => {
    setClientes(clientes.map(c => 
      c.id === clienteActualizado.id ? clienteActualizado : c
    ));
    setClienteEditing(null);
  };

  const eliminarCliente = (id: string) => {
    setClientes(clientes.filter(c => c.id !== id));
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
                  <span className="text-2xl">👥</span>
                  <span>Gestión de Clientes</span>
                </h1>
                <p className="text-gray-600">Administra tu base de clientes</p>
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
                      <span className="text-2xl">👥</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Clientes</p>
                      <p className="text-2xl font-bold text-blue-600">{clientes.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Búsqueda y Lista */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-lg">🔍</span>
                    <span>Lista de Clientes</span>
                  </CardTitle>
                  <Dialog open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <span className="mr-2">➕</span>
                        Nuevo Cliente
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
                        <DialogDescription>
                          Completa los datos del nuevo cliente.
                        </DialogDescription>
                      </DialogHeader>
                      <FormularioCliente 
                        onSubmit={agregarCliente}
                        onCancel={() => setMostrarFormulario(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="mt-4">
                  <Input
                    placeholder="Buscar por nombre, identificación o email..."
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
                      <TableHead>Cliente</TableHead>
                      <TableHead>Identificación</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesFiltrados.map(cliente => (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{cliente.nombreCompleto}</p>
                            <p className="text-sm text-gray-500">{cliente.direccion}</p>
                            <p className="text-sm text-gray-500">CP: {cliente.codigoPostal}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{cliente.identificacion}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{cliente.email}</p>
                            <p className="text-sm text-gray-500">{cliente.telefono}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setClienteEditing(cliente)}
                                >
                                  ✏️
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Editar Cliente</DialogTitle>
                                  <DialogDescription>
                                    Modifica los datos del cliente seleccionado.
                                  </DialogDescription>
                                </DialogHeader>
                                {clienteEditing && (
                                  <FormularioCliente 
                                    cliente={clienteEditing}
                                    onSubmit={editarCliente}
                                    onCancel={() => setClienteEditing(null)}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => eliminarCliente(cliente.id)}
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
          <div className="md:col-span-1">
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
                  <span className="mr-2">👥</span>
                  Nuevo Cliente
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <span className="mr-2">📊</span>
                  Reporte Clientes
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <span className="mr-2">📄</span>
                  Exportar Lista
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
                <p>Gestiona la información básica de todos los clientes.</p>
                <p>Mantén actualizados los datos de contacto para una mejor comunicación.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FormularioClienteProps {
  cliente?: Cliente;
  onSubmit: (cliente: any) => void;
  onCancel: () => void;
}

function FormularioCliente({ cliente, onSubmit, onCancel }: FormularioClienteProps) {
  const [nombreCompleto, setNombreCompleto] = useState(cliente?.nombreCompleto || '');
  const [identificacion, setIdentificacion] = useState(cliente?.identificacion || '');
  const [direccion, setDireccion] = useState(cliente?.direccion || '');
  const [codigoPostal, setCodigoPostal] = useState(cliente?.codigoPostal || '');
  const [telefono, setTelefono] = useState(cliente?.telefono || '');
  const [email, setEmail] = useState(cliente?.email || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clienteData = {
      ...(cliente ? { id: cliente.id } : {}),
      nombreCompleto,
      identificacion,
      direccion,
      codigoPostal,
      telefono,
      email
    };
    onSubmit(clienteData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nombreCompleto">Nombre Completo</Label>
        <Input
          id="nombreCompleto"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="identificacion">Identificación</Label>
        <Input
          id="identificacion"
          value={identificacion}
          onChange={(e) => setIdentificacion(e.target.value)}
          placeholder="DNI/NIE/CIF"
          required
        />
      </div>

      <div>
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="codigoPostal">Código Postal</Label>
        <Input
          id="codigoPostal"
          value={codigoPostal}
          onChange={(e) => setCodigoPostal(e.target.value)}
          placeholder="35001"
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

      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          {cliente ? 'Actualizar' : 'Agregar'} Cliente
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
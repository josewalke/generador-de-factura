import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Screen } from '../../App';
import { useClientes } from '../../hooks';
import { Cliente, ClienteCreateData } from '../../services';
import { ArrowLeft, Plus, Search, Edit, Trash2, AlertCircle } from 'lucide-react';

interface ClientesScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function ClientesScreen({ onNavigate }: ClientesScreenProps) {
  const [busqueda, setBusqueda] = useState('');
  const [clienteEditing, setClienteEditing] = useState<Cliente | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClienteCreateData>({
    nombre: '',
    identificacion: '',
    direccion: '',
    telefono: '',
    email: '',
    codigo_postal: ''
  });

  const {
    clientes,
    loading,
    error,
    createCliente,
    updateCliente,
    deleteCliente,
    searchClientes,
    refreshClientes
  } = useClientes();

  // Filtrar clientes localmente para búsqueda rápida
  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.identificacion?.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleBusqueda = async () => {
    if (busqueda.trim()) {
      await searchClientes(busqueda);
    } else {
      await refreshClientes();
    }
  };

  const handleCrearCliente = async () => {
    // Validar campos obligatorios
    if (!formData.nombre.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }
    if (!formData.identificacion.trim()) {
      setFormError('La identificación es obligatoria');
      return;
    }
    if (!formData.direccion.trim()) {
      setFormError('La dirección es obligatoria');
      return;
    }

    try {
      console.log('Enviando datos del cliente:', formData);
      await createCliente(formData);
      setFormData({
        nombre: '',
        identificacion: '',
        direccion: '',
        telefono: '',
        email: '',
        codigo_postal: ''
      });
      setMostrarFormulario(false);
      setFormError(null);
    } catch (error) {
      console.error('Error al crear cliente:', error);
    }
  };

  const handleEditarCliente = async () => {
    if (!clienteEditing) return;
    
    try {
      await updateCliente(clienteEditing.id, {
        nombre: formData.nombre,
        identificacion: formData.identificacion,
        direccion: formData.direccion,
        telefono: formData.telefono,
        email: formData.email,
        codigo_postal: formData.codigo_postal
      });
      
      // Cerrar el modal después de actualizar exitosamente
      setMostrarFormulario(false);
      setClienteEditing(null);
      setFormData({
        nombre: '',
        identificacion: '',
        direccion: '',
        telefono: '',
        email: '',
        codigo_postal: ''
      });
      setFormError(null);
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
    }
  };

  const handleEliminarCliente = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        await deleteCliente(id);
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
      }
    }
  };

  const abrirFormularioEdicion = (cliente: Cliente) => {
    setClienteEditing(cliente);
    setFormData({
      nombre: cliente.nombre,
      identificacion: cliente.identificacion || '',
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      email: cliente.email,
      codigo_postal: cliente.codigo_postal || ''
    });
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setClienteEditing(null);
    setFormData({
      nombre: '',
      identificacion: '',
      direccion: '',
      telefono: '',
      email: '',
      codigo_postal: ''
    });
    setFormError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
                <p className="text-gray-600">Gestiona tu base de datos de clientes</p>
              </div>
            </div>
            <Button
              onClick={() => setMostrarFormulario(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Cliente</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Búsqueda y filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="busqueda">Buscar clientes</Label>
                <div className="flex space-x-2">
                  <Input
                    id="busqueda"
                    placeholder="Buscar por nombre, identificación o email..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBusqueda()}
                  />
                  <Button onClick={handleBusqueda} variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button onClick={refreshClientes} variant="outline">
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {formError && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {/* Lista de clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lista de Clientes</span>
              <Badge variant="secondary">
                {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando clientes...</p>
              </div>
            ) : (
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
                          <p className="font-semibold">{cliente.nombre}</p>
                          <p className="text-sm text-gray-500">{cliente.direccion}</p>
                          {cliente.codigo_postal && (
                            <p className="text-sm text-gray-500">CP: {cliente.codigo_postal}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {cliente.identificacion && (
                          <Badge variant="outline">{cliente.identificacion}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{cliente.email}</p>
                          <p className="text-sm text-gray-500">{cliente.telefono}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirFormularioEdicion(cliente)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEliminarCliente(cliente.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Formulario de cliente */}
        <Dialog open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {clienteEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
              </DialogTitle>
              <DialogDescription>
                {clienteEditing 
                  ? 'Modifica los datos del cliente seleccionado.'
                  : 'Completa los datos para crear un nuevo cliente.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre completo *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre completo del cliente"
                />
              </div>
              
              <div>
                <Label htmlFor="identificacion">Identificación *</Label>
                <Input
                  id="identificacion"
                  value={formData.identificacion}
                  onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                  placeholder="CIF, NIF o identificación del cliente"
                />
              </div>
              
              <div>
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Dirección completa"
                />
              </div>
              
              <div>
                <Label htmlFor="codigo_postal">Código Postal</Label>
                <Input
                  id="codigo_postal"
                  value={formData.codigo_postal}
                  onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                  placeholder="Código postal"
                />
              </div>
              
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Número de teléfono"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Correo electrónico"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={cerrarFormulario}>
                Cancelar
              </Button>
              <Button 
                onClick={clienteEditing ? handleEditarCliente : handleCrearCliente}
                disabled={!formData.nombre.trim() || !formData.identificacion.trim() || !formData.direccion.trim()}
              >
                {clienteEditing ? 'Actualizar' : 'Crear'} Cliente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
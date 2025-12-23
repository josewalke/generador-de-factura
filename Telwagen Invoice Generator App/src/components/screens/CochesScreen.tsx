import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Screen } from '../../App';

interface CochesScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface Coche {
  id: string;
  matricula: string;
  chasis: string;
  color: string;
  kilometros: number;
  modelo: string;
}

export function CochesScreen({ onNavigate }: CochesScreenProps) {
  const [busqueda, setBusqueda] = useState('');
  const [cocheEditing, setCocheEditing] = useState<Coche | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [vistaActual, setVistaActual] = useState<'tabla' | 'tarjetas'>('tabla');

  // Mock data
  const [coches, setCoches] = useState<Coche[]>([
    {
      id: '1',
      matricula: '1234-ABC',
      chasis: 'VF1RFA00012345678',
      color: 'Blanco',
      kilometros: 15000,
      modelo: 'Nissan Qashqai'
    },
    {
      id: '2',
      matricula: '5678-DEF',
      chasis: 'VF1RFA00012345679',
      color: 'Negro',
      kilometros: 25000,
      modelo: 'Nissan X-Trail'
    },
    {
      id: '3',
      matricula: '9012-GHI',
      chasis: 'VF1RFA00012345680',
      color: 'Gris',
      kilometros: 0,
      modelo: 'Nissan Micra'
    },
    {
      id: '4',
      matricula: '3456-JKL',
      chasis: 'VF1RFA00012345681',
      color: 'Azul',
      kilometros: 8500,
      modelo: 'Nissan Leaf'
    }
  ]);

  const cochesFiltrados = coches.filter(coche =>
    coche.matricula.toLowerCase().includes(busqueda.toLowerCase()) ||
    coche.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
    coche.color.toLowerCase().includes(busqueda.toLowerCase()) ||
    coche.chasis.toLowerCase().includes(busqueda.toLowerCase())
  );

  const stats = {
    total: coches.length,
    nuevos: coches.filter(c => c.kilometros === 0).length,
    usados: coches.filter(c => c.kilometros > 0).length
  };

  const agregarCoche = (nuevoCoche: Omit<Coche, 'id'>) => {
    const coche: Coche = {
      ...nuevoCoche,
      id: Date.now().toString()
    };
    setCoches([...coches, coche]);
    setMostrarFormulario(false);
  };

  const editarCoche = (cocheActualizado: Coche) => {
    setCoches(coches.map(c => 
      c.id === cocheActualizado.id ? cocheActualizado : c
    ));
    setCocheEditing(null);
  };

  const eliminarCoche = (id: string) => {
    setCoches(coches.filter(c => c.id !== id));
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
                  <span className="text-2xl">🚗</span>
                  <span>Inventario de Vehículos</span>
                </h1>
                <p className="text-gray-600">Gestión del inventario de coches</p>
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
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <span className="text-2xl">🚗</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Vehículos</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controles */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-lg">🔍</span>
                    <span>Inventario de Vehículos</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Tabs value={vistaActual} onValueChange={(value) => setVistaActual(value as 'tabla' | 'tarjetas')}>
                      <TabsList>
                        <TabsTrigger value="tabla">📊 Tabla</TabsTrigger>
                        <TabsTrigger value="tarjetas">🃏 Tarjetas</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Dialog open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <span className="mr-2">➕</span>
                          Nuevo Coche
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Agregar Nuevo Vehículo</DialogTitle>
                          <DialogDescription>
                            Completa los datos del nuevo vehículo.
                          </DialogDescription>
                        </DialogHeader>
                        <FormularioCoche 
                          onSubmit={agregarCoche}
                          onCancel={() => setMostrarFormulario(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="mt-4">
                  <Input
                    placeholder="Buscar por matrícula, modelo, color o chasis..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={vistaActual}>
                  <TabsContent value="tabla" className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matrícula</TableHead>
                          <TableHead>Modelo</TableHead>
                          <TableHead>Color</TableHead>
                          <TableHead>Kilómetros</TableHead>
                          <TableHead>Chasis</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cochesFiltrados.map(coche => (
                          <TableRow key={coche.id}>
                            <TableCell>
                              <p className="font-semibold">{coche.matricula}</p>
                            </TableCell>
                            <TableCell>
                              <p>{coche.modelo}</p>
                            </TableCell>
                            <TableCell>
                              <p>{coche.color}</p>
                            </TableCell>
                            <TableCell>
                              <p>{coche.kilometros.toLocaleString()} km</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-gray-500">{coche.chasis}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setCocheEditing(coche)}
                                    >
                                      ✏️
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Editar Vehículo</DialogTitle>
                                      <DialogDescription>
                                        Modifica los datos del vehículo seleccionado.
                                      </DialogDescription>
                                    </DialogHeader>
                                    {cocheEditing && (
                                      <FormularioCoche 
                                        coche={cocheEditing}
                                        onSubmit={editarCoche}
                                        onCancel={() => setCocheEditing(null)}
                                      />
                                    )}
                                  </DialogContent>
                                </Dialog>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => eliminarCoche(coche.id)}
                                >
                                  🗑️
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  
                  <TabsContent value="tarjetas" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {cochesFiltrados.map(coche => (
                        <Card key={coche.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{coche.modelo}</h3>
                                <p className="text-sm text-gray-500">{coche.matricula}</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500">Color</p>
                                <p>{coche.color}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Kilómetros</p>
                                <p>{coche.kilometros.toLocaleString()} km</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-gray-500">Chasis</p>
                                <p className="text-xs">{coche.chasis}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2 pt-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1"
                                    onClick={() => setCocheEditing(coche)}
                                  >
                                    ✏️ Editar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Editar Vehículo</DialogTitle>
                                    <DialogDescription>
                                      Modifica los datos del vehículo seleccionado.
                                    </DialogDescription>
                                  </DialogHeader>
                                  {cocheEditing && (
                                    <FormularioCoche 
                                      coche={cocheEditing}
                                      onSubmit={editarCoche}
                                      onCancel={() => setCocheEditing(null)}
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => eliminarCoche(coche.id)}
                              >
                                🗑️
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                  <span className="mr-2">🚗</span>
                  Nuevo Vehículo
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {/* TODO: Implementar importar */}}
                >
                  <span className="mr-2">📥</span>
                  Importar Lista
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
                <p>Gestiona el inventario completo de vehículos con información básica.</p>
                <p>Los vehículos con 0 km se consideran nuevos.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FormularioCocheProps {
  coche?: Coche;
  onSubmit: (coche: any) => void;
  onCancel: () => void;
}

function FormularioCoche({ coche, onSubmit, onCancel }: FormularioCocheProps) {
  const [matricula, setMatricula] = useState(coche?.matricula || '');
  const [chasis, setChasis] = useState(coche?.chasis || '');
  const [color, setColor] = useState(coche?.color || '');
  const [kilometros, setKilometros] = useState(coche?.kilometros || 0);
  const [modelo, setModelo] = useState(coche?.modelo || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cocheData = {
      ...(coche ? { id: coche.id } : {}),
      matricula,
      chasis,
      color,
      kilometros,
      modelo
    };
    onSubmit(cocheData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="matricula">Matrícula</Label>
        <Input
          id="matricula"
          value={matricula}
          onChange={(e) => setMatricula(e.target.value)}
          placeholder="1234-ABC"
          required
        />
      </div>

      <div>
        <Label htmlFor="modelo">Modelo</Label>
        <Input
          id="modelo"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          placeholder="Nissan Qashqai"
          required
        />
      </div>

      <div>
        <Label htmlFor="chasis">Chasis (VIN)</Label>
        <Input
          id="chasis"
          value={chasis}
          onChange={(e) => setChasis(e.target.value)}
          placeholder="VF1RFA00012345678"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Blanco"
            required
          />
        </div>

        <div>
          <Label htmlFor="kilometros">Kilómetros</Label>
          <Input
            id="kilometros"
            type="number"
            value={kilometros}
            onChange={(e) => setKilometros(Number(e.target.value))}
            min="0"
            required
          />
        </div>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1">
          {coche ? 'Actualizar' : 'Agregar'} Vehículo
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
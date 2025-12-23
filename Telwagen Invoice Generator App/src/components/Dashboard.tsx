import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Screen } from '../App';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [connectionStatus] = React.useState<'connecting' | 'connected' | 'disconnected'>('connected');

  const stats = {
    totalClientes: 45,
    totalCoches: 23,
    totalFacturas: 127,
    ingresosMes: 45620
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Telwagen</h1>
              <p className="text-gray-600 mt-1">Generador de Facturas</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
              <span className="text-sm text-gray-600">{getConnectionStatusText()}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Alerts Section */}
            <Alert className="border-orange-200 bg-orange-50">
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
                    <span className="text-xl">👥</span>
                    <span>Clientes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Gestiona tu base de clientes</p>
                  <p className="mt-2 font-semibold text-blue-600">{stats.totalClientes} clientes</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('coches')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-xl">🚗</span>
                    <span>Coches</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Inventario de vehículos</p>
                  <p className="mt-2 font-semibold text-blue-600">{stats.totalCoches} vehículos</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('empresas')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-xl">🏢</span>
                    <span>Empresas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Configuración de empresas</p>
                  <p className="mt-2 font-semibold text-blue-600">2 empresas</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('historial')}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-xl">📊</span>
                    <span>Historial</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Facturas anteriores</p>
                  <p className="mt-2 font-semibold text-blue-600">{stats.totalFacturas} facturas</p>
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
                  <span className="text-lg">📈</span>
                  <span>Estadísticas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Clientes</span>
                  <Badge variant="secondary">{stats.totalClientes}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Coches</span>
                  <Badge variant="secondary">{stats.totalCoches}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Facturas</span>
                  <Badge variant="secondary">{stats.totalFacturas}</Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ingresos del Mes</span>
                    <span className="font-bold text-green-600">€{stats.ingresosMes.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
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
                  onClick={() => onNavigate('clientes')}
                >
                  <span className="mr-2">👤</span>
                  Nuevo Cliente
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onNavigate('coches')}
                >
                  <span className="mr-2">🚗</span>
                  Nuevo Coche
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onNavigate('empresas')}
                >
                  <span className="mr-2">🏢</span>
                  Nueva Empresa
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
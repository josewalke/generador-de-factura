import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { FacturasScreen } from './components/screens/FacturasScreen';
import { ClientesScreen } from './components/screens/ClientesScreen';
import { CochesScreen } from './components/screens/CochesScreen';
import { EmpresasScreen } from './components/screens/EmpresasScreen';
import { HistorialScreen } from './components/screens/HistorialScreen';

export type Screen = 'dashboard' | 'facturas' | 'clientes' | 'coches' | 'empresas' | 'historial';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentScreen} />;
      case 'facturas':
        return <FacturasScreen onNavigate={setCurrentScreen} />;
      case 'clientes':
        return <ClientesScreen onNavigate={setCurrentScreen} />;
      case 'coches':
        return <CochesScreen onNavigate={setCurrentScreen} />;
      case 'empresas':
        return <EmpresasScreen onNavigate={setCurrentScreen} />;
      case 'historial':
        return <HistorialScreen onNavigate={setCurrentScreen} />;
      default:
        return <Dashboard onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderScreen()}
    </div>
  );
}
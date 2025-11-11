import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { checkBackendConnection, getBackendInfo } from '../config/backend';

interface BackendStatusProps {
  className?: string;
}

export function BackendStatus({ className }: BackendStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [backendInfo, setBackendInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const connected = await checkBackendConnection();
      setIsConnected(connected);
      
      if (connected) {
        try {
          const info = await getBackendInfo();
          setBackendInfo(info);
        } catch (infoError) {
          console.error('Error getting backend info:', infoError);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Verificar conexión cada 30 segundos
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    if (isChecking) {
      return (
        <Badge variant="secondary" className="flex items-center space-x-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Verificando...</span>
        </Badge>
      );
    }

    if (isConnected === true) {
      return (
        <Badge variant="default" className="flex items-center space-x-1 bg-green-600">
          <Wifi className="h-3 w-3" />
          <span>Conectado</span>
        </Badge>
      );
    }

    if (isConnected === false) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <WifiOff className="h-3 w-3" />
          <span>Desconectado</span>
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        <span>Desconocido</span>
      </Badge>
    );
  };

  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        {getStatusBadge()}
        <Button
          variant="ghost"
          size="sm"
          onClick={checkConnection}
          disabled={isChecking}
          className="h-6 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <Alert className="mt-2" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {backendInfo && isConnected && (
        <div className="mt-2 text-xs text-gray-600">
          <div>Backend: {backendInfo.message}</div>
          <div>Versión: {backendInfo.version}</div>
          {backendInfo.features && (
            <div className="flex space-x-1 mt-1">
              {backendInfo.features.pagination && (
                <Badge variant="outline" className="text-xs">Paginación</Badge>
              )}
              {backendInfo.features.caching && (
                <Badge variant="outline" className="text-xs">Caché</Badge>
              )}
              {backendInfo.features.leyAntifraude && (
                <Badge variant="outline" className="text-xs">Ley Antifraude</Badge>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

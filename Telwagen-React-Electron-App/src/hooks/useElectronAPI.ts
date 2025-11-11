import { useEffect, useState, useCallback } from 'react';

// Declaración de tipos para la API de Electron
declare global {
  interface Window {
    electronAPI?: {
      getAppVersion: () => Promise<string>;
      showMessageBox: (options: any) => Promise<any>;
      onMenuNewInvoice: (callback: () => void) => void;
      onMenuOpen: (callback: () => void) => void;
      onMenuAbout: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;
      platform: string;
      isElectron: boolean;
    };
    isElectron?: boolean;
    platform?: string;
  }
}

export function useElectronAPI() {
  const [isElectron, setIsElectron] = useState(false);
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsElectron(!!window.isElectron);
      setPlatform(window.platform || '');
    }
  }, []);

  const showMessageBox = useCallback(async (options: {
    type?: 'info' | 'warning' | 'error' | 'question';
    title?: string;
    message: string;
    buttons?: string[];
  }) => {
    if (window.electronAPI) {
      return await window.electronAPI.showMessageBox(options);
    }
    return { response: 0 };
  }, []);

  const getAppVersion = useCallback(async () => {
    if (window.electronAPI) {
      return await window.electronAPI.getAppVersion();
    }
    return '1.0.0';
  }, []);

  const onMenuAction = useCallback((action: 'newInvoice' | 'open' | 'about', callback: () => void) => {
    if (window.electronAPI) {
      switch (action) {
        case 'newInvoice':
          window.electronAPI.onMenuNewInvoice(callback);
          break;
        case 'open':
          window.electronAPI.onMenuOpen(callback);
          break;
        case 'about':
          window.electronAPI.onMenuAbout(callback);
          break;
      }
    }
  }, []);

  const removeMenuListeners = useCallback((channel: string) => {
    if (window.electronAPI) {
      window.electronAPI.removeAllListeners(channel);
    }
  }, []);

  return {
    isElectron,
    platform,
    showMessageBox,
    getAppVersion,
    onMenuAction,
    removeMenuListeners
  };
}

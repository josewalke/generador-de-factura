# Debugging de Error 500 en Creación de Clientes

## Problema Identificado

A pesar de haber corregido los campos de cliente, el frontend seguía mostrando error 500 al crear clientes, mientras que el backend funcionaba correctamente cuando se probaba directamente.

## Diagnóstico Realizado

### 1. Verificación del Backend
- ✅ Backend funcionando correctamente en puerto 3000
- ✅ Creación de clientes funciona con curl/PowerShell
- ✅ Logging detallado agregado al endpoint POST /api/clientes

### 2. Identificación del Problema en el Frontend
El problema estaba en la configuración del `apiClient`:

**ANTES**:
```typescript
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000' 
  : 'http://localhost:3000';
```

**PROBLEMA**: En Electron renderer, `process.env.NODE_ENV` puede no estar definido correctamente.

**DESPUÉS**:
```typescript
import { BACKEND_URL } from '../config/backend';

const apiClient = axios.create({
  baseURL: BACKEND_URL, // ✅ Usa configuración centralizada
  // ...
});
```

## Correcciones Implementadas

### 1. Configuración Centralizada de API
- **Archivo**: `src/services/apiClient.ts`
- Cambiado de `process.env.NODE_ENV` a `BACKEND_URL` importado
- Agregado logging detallado para debugging

### 2. Logging Detallado Agregado

**Backend** (`server.js`):
```javascript
app.post('/api/clientes', (req, res) => {
    console.log('POST /api/clientes - Body recibido:', req.body);
    // Validación y logging detallado
    console.log('Insertando cliente con datos:', { ... });
    // ...
});
```

**Frontend** (`apiClient.ts`):
```typescript
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    console.error('Error Response:', status, data);
    // ...
  }
);
```

**Frontend** (`clienteService.ts`):
```typescript
async create(clienteData: ClienteCreateData): Promise<Cliente> {
  console.log('ClienteService.create - Enviando datos:', clienteData);
  const response = await apiClient.post('/api/clientes', clienteData);
  console.log('ClienteService.create - Respuesta recibida:', response.data);
  // ...
}
```

## Estado Actual

- ✅ Backend funcionando con logging detallado
- ✅ Frontend usando configuración centralizada de API
- ✅ Logging detallado en frontend y backend
- ✅ Campos de cliente corregidos
- ✅ Configuración de API centralizada

## Próximos Pasos

Con el logging detallado implementado, ahora es posible:

1. **Ver exactamente qué datos envía el frontend** en la consola del navegador
2. **Ver exactamente qué recibe el backend** en la consola del servidor
3. **Identificar cualquier discrepancia** entre lo enviado y lo esperado
4. **Debuggear errores específicos** con información detallada

## Instrucciones para Testing

1. **Abrir la aplicación Electron**
2. **Abrir DevTools** (F12)
3. **Ir a la pestaña Console**
4. **Intentar crear un cliente**
5. **Revisar los logs** tanto en DevTools como en la consola del backend

Los logs mostrarán:
- Datos enviados desde el frontend
- Datos recibidos en el backend
- Respuesta del backend
- Cualquier error específico

Esto permitirá identificar exactamente dónde está el problema si persiste.

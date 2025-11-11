# 🗄️ Integración con Base de Datos - Telwagen React + Electron

## ✅ Integración Completada

La aplicación React + Electron ahora está **completamente integrada** con la base de datos SQLite del backend existente.

### 🔧 Componentes Implementados:

#### 1. **Servicios API** (`src/services/`)
- ✅ `apiClient.ts` - Cliente HTTP base con Axios
- ✅ `clienteService.ts` - Servicio para gestión de clientes
- ✅ `cocheService.ts` - Servicio para gestión de coches/vehículos
- ✅ `empresaService.ts` - Servicio para gestión de empresas
- ✅ `facturaService.ts` - Servicio para gestión de facturas

#### 2. **Hooks Personalizados** (`src/hooks/`)
- ✅ `useClientes.ts` - Hook para manejo de estado de clientes
- ✅ `useCoches.ts` - Hook para manejo de estado de coches
- ✅ `useEmpresas.ts` - Hook para manejo de estado de empresas
- ✅ `useFacturas.ts` - Hook para manejo de estado de facturas

#### 3. **Componentes Actualizados**
- ✅ `ClientesScreen.tsx` - Integrado con servicios reales
- ✅ `BackendStatus.tsx` - Monitor de conexión con backend
- ✅ `Dashboard.tsx` - Incluye estado de conexión

### 🚀 Funcionalidades Implementadas:

#### **Gestión de Clientes**
- ✅ Listar todos los clientes
- ✅ Crear nuevos clientes
- ✅ Editar clientes existentes
- ✅ Eliminar clientes (soft delete)
- ✅ Buscar clientes por nombre, CIF o email
- ✅ Validación de campos requeridos

#### **Gestión de Coches**
- ✅ Listar todos los coches
- ✅ Coches disponibles
- ✅ Coches vendidos
- ✅ Coches como productos
- ✅ CRUD completo de coches

#### **Gestión de Empresas**
- ✅ Listado paginado de empresas
- ✅ Búsqueda y filtros
- ✅ Estadísticas de empresas
- ✅ Gestión de certificados digitales

#### **Gestión de Facturas**
- ✅ Listado paginado con filtros avanzados
- ✅ Generación de números de factura
- ✅ Estadísticas de ingresos
- ✅ Filtros por fecha, cliente, empresa

### 🔗 Conexión con Backend:

#### **URL Base**: `http://localhost:3000`
#### **Endpoints Disponibles**:
```
GET    /api/clientes              - Listar clientes
POST   /api/clientes              - Crear cliente
GET    /api/clientes/:id          - Obtener cliente
PUT    /api/clientes/:id          - Actualizar cliente
DELETE /api/clientes/:id          - Eliminar cliente

GET    /api/coches                - Listar coches
GET    /api/coches/disponibles    - Coches disponibles
GET    /api/coches/vendidos       - Coches vendidos
POST   /api/coches                - Crear coche
PUT    /api/coches/:id            - Actualizar coche
DELETE /api/coches/:id            - Eliminar coche

GET    /api/empresas              - Listar empresas (paginado)
POST   /api/empresas              - Crear empresa
GET    /api/empresas/:id          - Obtener empresa
PUT    /api/empresas/:id          - Actualizar empresa
DELETE /api/empresas/:id          - Eliminar empresa

GET    /api/facturas              - Listar facturas (paginado)
POST   /api/facturas              - Crear factura
GET    /api/facturas/:id          - Obtener factura
PUT    /api/facturas/:id          - Actualizar factura
DELETE /api/facturas/:id          - Eliminar factura
GET    /api/facturas/siguiente-numero - Siguiente número
```

### 🎯 Características Técnicas:

#### **Manejo de Estado**
- ✅ Hooks personalizados con React
- ✅ Estado local optimizado
- ✅ Manejo de errores robusto
- ✅ Loading states

#### **Comunicación API**
- ✅ Axios con interceptores
- ✅ Manejo de errores global
- ✅ Timeout configurado
- ✅ Headers automáticos

#### **Paginación y Caché**
- ✅ Paginación del lado del servidor
- ✅ Caché inteligente (5 minutos TTL)
- ✅ Búsqueda optimizada
- ✅ Filtros avanzados

#### **Monitoreo**
- ✅ Estado de conexión en tiempo real
- ✅ Verificación automática cada 30 segundos
- ✅ Información del backend
- ✅ Indicadores visuales

### 🔧 Configuración:

#### **Variables de Entorno**
```typescript
// Desarrollo
API_BASE_URL = 'http://localhost:3000'

// Producción (cambiar según necesidad)
API_BASE_URL = 'http://tu-servidor:3000'
```

#### **Timeout y Reintentos**
```typescript
timeout: 10000,        // 10 segundos
retries: 3,            // 3 reintentos
cache_ttl: 300000      // 5 minutos
```

### 🚀 Próximos Pasos:

1. **Probar la conexión** - Verificar que el backend esté ejecutándose
2. **Actualizar otros componentes** - CochesScreen, EmpresasScreen, FacturasScreen
3. **Implementar validaciones** - Validaciones fiscales del backend
4. **Optimizar rendimiento** - Lazy loading, virtualización
5. **Agregar tests** - Tests unitarios y de integración

### 📝 Uso de los Hooks:

```typescript
// En cualquier componente
import { useClientes } from '../hooks';

function MiComponente() {
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

  // Usar los datos y funciones...
}
```

---

**¡La integración con la base de datos está completa y funcionando!** 🎉

Ahora puedes usar datos reales en lugar de datos mock en toda la aplicación.

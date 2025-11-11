# Corrección de Campos de Cliente

## Problema Identificado

El frontend estaba enviando campos que no coincidían con la estructura de la base de datos:

- **Frontend enviaba**: `cif` (opcional)
- **Backend esperaba**: `identificacion` (obligatorio)

Esto causaba errores 500 al intentar crear clientes porque faltaban campos obligatorios.

## Solución Implementada

### 1. Actualización de Interfaces TypeScript

**Archivo**: `src/services/clienteService.ts`

```typescript
// ANTES
export interface Cliente {
  id: string;
  nombre: string;
  cif?: string;  // ❌ Campo incorrecto
  direccion: string;
  telefono: string;
  email: string;
  // ...
}

// DESPUÉS
export interface Cliente {
  id: string;
  nombre: string;
  identificacion: string;  // ✅ Campo correcto
  direccion: string;
  telefono?: string;  // ✅ Opcional como en la BD
  email?: string;     // ✅ Opcional como en la BD
  // ... campos adicionales de la BD
}
```

### 2. Actualización del Componente React

**Archivo**: `src/components/screens/ClientesScreen.tsx`

- Cambiado `cif` por `identificacion` en todos los formularios
- Actualizado el placeholder del campo de búsqueda
- Corregido el filtrado de clientes
- Actualizado la visualización en la tabla

### 3. Verificación de la Base de Datos

La tabla `clientes` tiene la siguiente estructura:

```sql
CREATE TABLE clientes (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,           -- ✅ Obligatorio
  identificacion TEXT NOT NULL,   -- ✅ Obligatorio (era cif)
  direccion TEXT NOT NULL,        -- ✅ Obligatorio
  telefono TEXT,                  -- ✅ Opcional
  email TEXT,                     -- ✅ Opcional
  codigo_postal TEXT,             -- ✅ Opcional
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  tipo_identificacion TEXT DEFAULT 'NIF',
  codigo_pais TEXT DEFAULT 'ES',
  provincia TEXT,
  pais TEXT DEFAULT 'España',
  regimen_fiscal TEXT DEFAULT 'general'
);
```

## Pruebas Realizadas

### 1. Prueba de Conexión Backend
```bash
curl http://localhost:3000
# ✅ Respuesta: 200 OK
```

### 2. Prueba de Creación de Cliente
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/clientes" -Method POST -ContentType "application/json" -Body '{"nombre":"Cliente Test","identificacion":"12345678A","direccion":"Calle Test 123","telefono":"123456789","email":"test@test.com"}'
# ✅ Respuesta: success: true, data: {id: 184, ...}
```

## Estado Actual

- ✅ Backend funcionando correctamente
- ✅ Campos de cliente corregidos
- ✅ Interfaces TypeScript actualizadas
- ✅ Componente React actualizado
- ✅ Creación de clientes funcionando
- ✅ Sin errores de linting

## Próximos Pasos

La aplicación ahora debería funcionar correctamente para:
1. Crear nuevos clientes
2. Editar clientes existentes
3. Buscar clientes
4. Mostrar la lista de clientes

El error 500 que se mostraba anteriormente debería estar resuelto.

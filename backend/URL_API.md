# URL del API Backend

## URL Base del Servidor

```
http://localhost:3000
```

## Configuración Actual

- **Puerto**: `3000`
- **Host**: `localhost`
- **URL Completa**: `http://localhost:3000`

## Endpoints Principales

### Base
- `GET http://localhost:3000/` - Documentación y estado del servidor

### API Principal
- `GET http://localhost:3000/api/...` - Todos los endpoints de la API

### Ejemplos de Endpoints

#### Clientes
- `GET http://localhost:3000/api/clientes` - Listar clientes
- `POST http://localhost:3000/api/clientes` - Crear cliente
- `GET http://localhost:3000/api/clientes/:id` - Obtener cliente por ID
- `PUT http://localhost:3000/api/clientes/:id` - Actualizar cliente
- `DELETE http://localhost:3000/api/clientes/:id` - Eliminar cliente

#### Facturas
- `GET http://localhost:3000/api/facturas` - Listar facturas
- `POST http://localhost:3000/api/facturas` - Crear factura
- `GET http://localhost:3000/api/facturas/:id` - Obtener factura por ID

#### Productos
- `GET http://localhost:3000/api/productos` - Listar productos
- `POST http://localhost:3000/api/productos` - Crear producto

#### Empresas
- `GET http://localhost:3000/api/empresas` - Listar empresas
- `GET http://localhost:3000/api/configuracion/empresa` - Configuración de empresa

## Configuración CORS

El servidor tiene CORS configurado para permitir peticiones desde:

- `http://localhost:5173` (Vite/React por defecto)
- `http://localhost:3000` (mismo servidor)
- `file://` (aplicaciones de escritorio)

### Si necesitas agregar otro origen

Edita el archivo `backend/config/config.js` y agrega tu URL al array `allowedOrigins`:

```javascript
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'file://',
    'http://tu-proyecto:puerto'  // Agrega aquí tu URL
];
```

## Ejemplo de Petición desde otro Proyecto

### JavaScript/Fetch
```javascript
fetch('http://localhost:3000/api/clientes', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Axios
```javascript
import axios from 'axios';

axios.get('http://localhost:3000/api/clientes')
    .then(response => console.log(response.data))
    .catch(error => console.error('Error:', error));
```

### cURL
```bash
curl http://localhost:3000/api/clientes
```

### Python (requests)
```python
import requests

response = requests.get('http://localhost:3000/api/clientes')
print(response.json())
```

## Notas Importantes

1. **Asegúrate de que el servidor esté ejecutándose** antes de hacer peticiones
2. **Si cambias el puerto**, actualiza la URL en tu proyecto cliente
3. **Para producción**, cambia `localhost` por la IP o dominio del servidor
4. **Si tienes problemas de CORS**, agrega tu origen a la lista de permitidos

## Cambiar Puerto o Host

Si necesitas cambiar el puerto o host, edita el archivo `.env` en la raíz del proyecto:

```env
PORT=3000
HOST=localhost
```

O usa variables de entorno al iniciar el servidor:

```bash
PORT=3001 HOST=0.0.0.0 npm run start:prod
```


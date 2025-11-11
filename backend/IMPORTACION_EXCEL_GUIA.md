# 📊 IMPORTACIÓN DESDE EXCEL - GUÍA COMPLETA

## 🚀 **FUNCIONALIDADES IMPLEMENTADAS**

### ✅ **Módulos Disponibles:**
- **Importador de Coches** desde Excel
- **Importador de Productos** desde Excel  
- **Importador de Clientes** desde Excel
- **Generador de Plantillas** Excel

---

## 📋 **ENDPOINTS DISPONIBLES**

### **1. Importar Coches**
```http
POST /api/importar/coches
Content-Type: multipart/form-data

FormData:
- archivo: archivo Excel (.xlsx, .xls)
```

### **2. Importar Productos**
```http
POST /api/importar/productos
Content-Type: multipart/form-data

FormData:
- archivo: archivo Excel (.xlsx, .xls)
```

### **3. Importar Clientes**
```http
POST /api/importar/clientes
Content-Type: multipart/form-data

FormData:
- archivo: archivo Excel (.xlsx, .xls)
```

### **4. Descargar Plantillas**
```http
GET /api/importar/plantilla/{tipo}

Tipos disponibles:
- coches
- productos  
- clientes
```

---

## 📊 **FORMATOS DE ARCHIVO EXCEL**

### **🚗 COCHES**
| Matricula | Chasis | Color | Kms | Modelo |
|-----------|--------|-------|-----|--------|
| GC-1234-AB | WBAVB13506PT12345 | Blanco | 45000 | BMW 320i |
| GC-5678-CD | WVWZZZ1KZAW123456 | Negro | 32000 | Volkswagen Golf |

**Campos obligatorios:** Matricula, Chasis, Color, Modelo
**Campos opcionales:** Kms (por defecto: 0)

### **📦 PRODUCTOS**
| Codigo | Descripcion | Precio | Stock |
|--------|-------------|--------|-------|
| NISSAN-MICRA-1.0 | Nissan Micra 1.0 | 15000 | 10 |
| NISSAN-QASHQAI-1.3 | Nissan Qashqai 1.3 | 25000 | 5 |

**Campos obligatorios:** Codigo, Descripcion
**Campos opcionales:** Precio (por defecto: 0), Stock (por defecto: 0)

### **👥 CLIENTES**
| Nombre | Direccion | Identificacion | Email | Telefono |
|--------|-----------|----------------|-------|----------|
| Cliente Ejemplo S.L. | Calle Ejemplo 123 | B12345678 | cliente@ejemplo.com | +34 123 456 789 |
| Otro Cliente S.A. | Avenida Test 456 | A87654321 | otro@ejemplo.com | +34 987 654 321 |

**Campos obligatorios:** Nombre, Identificacion
**Campos opcionales:** Direccion, Email, Telefono

---

## 🔧 **EJEMPLOS DE USO**

### **JavaScript/Fetch**
```javascript
// Importar coches
const formData = new FormData();
formData.append('archivo', fileInput.files[0]);

fetch('/api/importar/coches', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => {
    console.log('Resultado:', data);
    // {
    //   success: true,
    //   total: 100,
    //   importados: 95,
    //   errores: 5,
    //   erroresDetalle: [...]
    // }
});
```

### **cURL**
```bash
# Importar coches
curl -X POST \
  http://localhost:3000/api/importar/coches \
  -F "archivo=@coches.xlsx"

# Descargar plantilla
curl -X GET \
  http://localhost:3000/api/importar/plantilla/coches \
  -o plantilla_coches.xlsx
```

### **Postman**
1. **Método:** POST
2. **URL:** `http://localhost:3000/api/importar/coches`
3. **Body:** form-data
4. **Key:** `archivo` (tipo: File)
5. **Value:** Seleccionar archivo Excel

---

## 📈 **RESPUESTAS DE LA API**

### **✅ Éxito**
```json
{
  "success": true,
  "total": 100,
  "importados": 95,
  "errores": 5,
  "erroresDetalle": [
    {
      "fila": 3,
      "error": "Faltan campos obligatorios",
      "datos": { "Matricula": "GC-1234-AB", "Color": "Blanco" }
    }
  ]
}
```

### **❌ Error**
```json
{
  "success": false,
  "error": "No se ha proporcionado ningún archivo"
}
```

---

## 🛡️ **VALIDACIONES Y LÍMITES**

### **Archivos Permitidos:**
- ✅ `.xlsx` (Excel 2007+)
- ✅ `.xls` (Excel 97-2003)
- ❌ Otros formatos

### **Límites:**
- **Tamaño máximo:** 10MB
- **Campos obligatorios:** Validación automática
- **Duplicados:** Se reemplazan automáticamente

### **Validaciones:**
- Matrículas únicas para coches
- Códigos únicos para productos
- Identificaciones únicas para clientes

---

## 🔍 **CARACTERÍSTICAS AVANZADAS**

### **Mapeo Flexible de Columnas**
El sistema reconoce múltiples variaciones de nombres de columnas:
- `Matricula`, `matricula`, `MATRICULA`
- `Chasis`, `chasis`, `CHASIS`
- `Color`, `color`, `COLOR`
- etc.

### **Manejo de Errores**
- Continúa procesando aunque haya errores
- Reporta filas específicas con problemas
- Mantiene datos válidos aunque otros fallen

### **Limpieza Automática**
- Archivos temporales se eliminan automáticamente
- No deja residuos en el servidor

---

## 🚀 **PRÓXIMOS PASOS**

1. **Probar la importación** con archivos de ejemplo
2. **Descargar plantillas** para ver el formato correcto
3. **Integrar en el frontend** con formularios de subida
4. **Personalizar validaciones** según necesidades específicas

---

## 📞 **SOPORTE**

Si encuentras problemas:
1. Verifica el formato del archivo Excel
2. Revisa que los campos obligatorios estén presentes
3. Comprueba que los nombres de columnas coincidan
4. Consulta los errores detallados en la respuesta

¡La funcionalidad de importación desde Excel está lista para usar! 🎉



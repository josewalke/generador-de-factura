const XLSX = require('xlsx');
const path = require('path');

// Crear archivo de ejemplo para coches
function crearEjemploCoches() {
    const datos = [
        ['Matricula', 'Chasis', 'Color', 'Kms', 'Modelo'],
        ['GC-1234-AB', 'WBAVB13506PT12345', 'Blanco', 45000, 'BMW 320i'],
        ['GC-5678-CD', 'WVWZZZ1KZAW123456', 'Negro', 32000, 'Volkswagen Golf'],
        ['GC-9012-EF', 'WAUZZZ8V8KA123456', 'Azul', 28000, 'Audi A4'],
        ['GC-3456-GH', 'WDB12345678901234', 'Plateado', 55000, 'Mercedes C-Class'],
        ['GC-7890-IJ', 'VF123456789012345', 'Rojo', 42000, 'Peugeot 308']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);
    XLSX.utils.book_append_sheet(wb, ws, 'Coches');
    
    const filePath = path.join(__dirname, 'ejemplo_coches.xlsx');
    XLSX.writeFile(wb, filePath);
    console.log('✅ Archivo de ejemplo creado:', filePath);
}

// Crear archivo de ejemplo para productos
function crearEjemploProductos() {
    const datos = [
        ['Codigo', 'Descripcion', 'Precio', 'Stock'],
        ['NISSAN-MICRA-1.0', 'Nissan Micra 1.0 IGT ACENTA', 15000, 10],
        ['NISSAN-QASHQAI-1.3', 'Nissan Qashqai 1.3 DIG-T ACENTA', 25000, 5],
        ['NISSAN-LEAF-40KWH', 'Nissan Leaf 40kWh ACENTA', 35000, 3],
        ['NISSAN-JUKE-1.0', 'Nissan Juke 1.0 DIG-T ACENTA', 18000, 8],
        ['NISSAN-X-TRAIL-2.0', 'Nissan X-Trail 2.0 DIG-T ACENTA', 30000, 2]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    
    const filePath = path.join(__dirname, 'ejemplo_productos.xlsx');
    XLSX.writeFile(wb, filePath);
    console.log('✅ Archivo de ejemplo creado:', filePath);
}

// Crear archivo de ejemplo para clientes
function crearEjemploClientes() {
    const datos = [
        ['Nombre', 'Direccion', 'Identificacion', 'Email', 'Telefono'],
        ['Cliente Ejemplo S.L.', 'Calle Ejemplo 123, Las Palmas', 'B12345678', 'cliente@ejemplo.com', '+34 123 456 789'],
        ['Otro Cliente S.A.', 'Avenida Test 456, Madrid', 'A87654321', 'otro@ejemplo.com', '+34 987 654 321'],
        ['Empresa Demo S.L.', 'Plaza Demo 789, Barcelona', 'B11223344', 'demo@empresa.com', '+34 555 666 777'],
        ['Cliente Final S.A.', 'Calle Final 321, Valencia', 'A99887766', 'final@cliente.com', '+34 111 222 333']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    
    const filePath = path.join(__dirname, 'ejemplo_clientes.xlsx');
    XLSX.writeFile(wb, filePath);
    console.log('✅ Archivo de ejemplo creado:', filePath);
}

// Ejecutar si se llama directamente
if (require.main === module) {
    console.log('📊 Creando archivos de ejemplo para importación...');
    crearEjemploCoches();
    crearEjemploProductos();
    crearEjemploClientes();
    console.log('🎉 Archivos de ejemplo creados exitosamente!');
}

module.exports = {
    crearEjemploCoches,
    crearEjemploProductos,
    crearEjemploClientes
};



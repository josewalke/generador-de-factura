const XLSX = require('xlsx');
const path = require('path');

// Crear datos de ejemplo para coches
const datosCoches = [
    ['Matricula', 'Chasis', 'Color', 'Kms', 'Modelo'],
    ['GC-1234-AB', 'WBAVB13506PT12345', 'Blanco', 45000, 'BMW 320i'],
    ['GC-5678-CD', 'WVWZZZ1KZAW123456', 'Negro', 32000, 'Volkswagen Golf'],
    ['GC-9012-EF', 'WAUZZZ8V8KA123456', 'Azul', 28000, 'Audi A4'],
    ['GC-3456-GH', '1HGBH41JXMN109186', 'Rojo', 15000, 'Honda Civic'],
    ['GC-7890-IJ', 'JM1BK32F381234567', 'Gris', 22000, 'Mazda 3']
];

// Crear workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(datosCoches);

// Añadir hoja al workbook
XLSX.utils.book_append_sheet(wb, ws, 'Coches');

// Guardar archivo
const filePath = path.join(__dirname, 'test_coches_simple.xlsx');
XLSX.writeFile(wb, filePath);

console.log('✅ Archivo de prueba creado:', filePath);
console.log('📊 Datos incluidos:');
datosCoches.forEach((fila, index) => {
    console.log(`Fila ${index + 1}:`, fila);
});



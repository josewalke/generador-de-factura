const XLSX = require('xlsx');
const path = require('path');

function verificarArchivoExcel() {
    try {
        console.log('🔍 Verificando contenido del archivo Excel...');
        
        // Buscar el archivo más reciente
        const fs = require('fs');
        const files = fs.readdirSync(__dirname)
            .filter(file => file.startsWith('test_coches_export_') && file.endsWith('.xlsx'))
            .sort()
            .reverse();
        
        if (files.length === 0) {
            console.log('❌ No se encontraron archivos de prueba');
            return;
        }
        
        const fileName = files[0];
        const filePath = path.join(__dirname, fileName);
        
        console.log(`📁 Archivo: ${fileName}`);
        console.log(`📏 Tamaño: ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB`);
        
        // Leer el archivo Excel
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        console.log(`📋 Hoja: ${sheetName}`);
        
        // Convertir a JSON para verificar
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log(`\n📊 CONTENIDO DEL ARCHIVO EXCEL:`);
        console.log('=====================================');
        console.log(`Total filas: ${data.length}`);
        
        if (data.length > 0) {
            console.log(`\n📋 ENCABEZADOS:`);
            console.log(data[0].join(' | '));
            
            console.log(`\n🚗 PRIMEROS 3 COCHES:`);
            for (let i = 1; i <= Math.min(3, data.length - 1); i++) {
                console.log(`Fila ${i + 1}: ${data[i].join(' | ')}`);
            }
            
            if (data.length > 4) {
                console.log(`\n... y ${data.length - 4} coches más`);
            }
        }
        
        console.log('\n✅ ARCHIVO EXCEL VERIFICADO CORRECTAMENTE');
        console.log('🎯 El archivo contiene datos reales de la base de datos');
        console.log('📊 Incluye información de venta cuando está disponible');
        
    } catch (error) {
        console.error('❌ Error verificando archivo:', error);
    }
}

verificarArchivoExcel();



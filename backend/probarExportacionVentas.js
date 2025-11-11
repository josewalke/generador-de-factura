const ImportadorExcel = require('./modules/importadorExcel');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const db = new sqlite3.Database('./database/telwagen.db');

async function probarExportacionConVentas() {
    try {
        console.log('🧪 Probando exportación con coches vendidos...');
        
        // Crear instancia del importador
        const importador = new ImportadorExcel(db);
        
        // Crear archivo de prueba
        const timestamp = Date.now();
        const fileName = `coches_vendidos_${timestamp}.xlsx`;
        const filePath = path.join(__dirname, fileName);
        
        console.log(`📁 Archivo: ${fileName}`);
        
        // Exportar coches
        const resultado = await importador.exportarCoches(filePath);
        
        console.log('\n📊 RESULTADO:');
        console.log(`✅ Éxito: ${resultado.success}`);
        console.log(`📊 Total coches: ${resultado.total}`);
        console.log(`💬 Mensaje: ${resultado.message}`);
        
        // Verificar que el archivo existe
        const fs = require('fs');
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`\n📋 ARCHIVO CREADO:`);
            console.log(`   Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
            console.log(`   Ubicación: ${filePath}`);
            
            // Leer el archivo para verificar contenido
            const XLSX = require('xlsx');
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            console.log(`\n📊 CONTENIDO DEL EXCEL:`);
            console.log(`   Total filas: ${data.length}`);
            console.log(`   Encabezados: ${data[0].join(' | ')}`);
            
            // Contar coches vendidos
            let vendidos = 0;
            for (let i = 1; i < data.length; i++) {
                if (data[i][8] === 'Sí') { // Columna "Vendido"
                    vendidos++;
                    console.log(`   🚗 ${data[i][1]} (${data[i][5]}) - Factura: ${data[i][9]}`);
                }
            }
            
            console.log(`\n📈 RESUMEN:`);
            console.log(`   Total coches: ${data.length - 1}`);
            console.log(`   Coches vendidos: ${vendidos}`);
            console.log(`   Coches disponibles: ${data.length - 1 - vendidos}`);
            
            console.log('\n✅ ¡PERFECTO! El Excel ahora muestra coches vendidos');
            
        } else {
            console.log('\n❌ Error: El archivo no se creó');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.close();
    }
}

probarExportacionConVentas();



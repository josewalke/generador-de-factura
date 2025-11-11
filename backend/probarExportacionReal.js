const ImportadorExcel = require('./modules/importadorExcel');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const db = new sqlite3.Database('./database/telwagen.db');

async function probarExportacionExcel() {
    try {
        console.log('🧪 Probando exportación de coches a Excel...');
        
        // Crear instancia del importador
        const importador = new ImportadorExcel(db);
        
        // Crear archivo de prueba
        const timestamp = Date.now();
        const fileName = `test_coches_export_${timestamp}.xlsx`;
        const filePath = path.join(__dirname, fileName);
        
        console.log(`📁 Archivo de destino: ${filePath}`);
        
        // Exportar coches
        const resultado = await importador.exportarCoches(filePath);
        
        console.log('\n📊 RESULTADO DE LA EXPORTACIÓN:');
        console.log('================================');
        console.log(`✅ Éxito: ${resultado.success}`);
        console.log(`📊 Total coches: ${resultado.total}`);
        console.log(`📁 Archivo: ${resultado.filePath}`);
        console.log(`💬 Mensaje: ${resultado.message}`);
        
        // Verificar que el archivo existe
        const fs = require('fs');
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`\n📋 INFORMACIÓN DEL ARCHIVO:`);
            console.log(`   Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
            console.log(`   Creado: ${stats.birthtime.toLocaleString('es-ES')}`);
            console.log(`   Modificado: ${stats.mtime.toLocaleString('es-ES')}`);
            
            console.log('\n✅ ARCHIVO EXCEL CREADO CORRECTAMENTE');
            console.log('🎯 Puedes abrir el archivo con Excel o LibreOffice');
        } else {
            console.log('\n❌ ERROR: El archivo no se creó');
        }
        
    } catch (error) {
        console.error('❌ Error en la exportación:', error);
    } finally {
        db.close();
    }
}

probarExportacionExcel();



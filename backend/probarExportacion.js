const ImportadorExcel = require('./modules/importadorExcel');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const db = new sqlite3.Database('./database/telwagen.db');

// Crear instancia del importador
const importador = new ImportadorExcel(db);

async function probarExportacion() {
    try {
        console.log('🧪 Probando exportación de coches...');
        
        const filePath = path.join(__dirname, 'test_export_coches.xlsx');
        console.log('📁 Archivo a crear:', filePath);
        
        // Exportar sin filtros
        const resultado = await importador.exportarCoches(filePath);
        
        console.log('\n📊 RESULTADO DE LA EXPORTACIÓN:');
        console.log('================================');
        console.log('✅ Éxito:', resultado.success);
        console.log('📈 Total exportados:', resultado.total);
        console.log('📁 Archivo:', resultado.filePath);
        console.log('💬 Mensaje:', resultado.message);
        
        if (resultado.error) {
            console.log('\n❌ ERROR:', resultado.error);
        }
        
        // Probar con filtros
        console.log('\n🔍 Probando exportación con filtros...');
        const filePathFiltrado = path.join(__dirname, 'test_export_coches_filtrado.xlsx');
        
        const filtros = {
            modelo: 'BMW',
            color: 'Blanco'
        };
        
        const resultadoFiltrado = await importador.exportarCoches(filePathFiltrado, filtros);
        
        console.log('\n📊 RESULTADO CON FILTROS:');
        console.log('=========================');
        console.log('✅ Éxito:', resultadoFiltrado.success);
        console.log('📈 Total exportados:', resultadoFiltrado.total);
        console.log('📁 Archivo:', resultadoFiltrado.filePath);
        console.log('💬 Mensaje:', resultadoFiltrado.message);
        
        console.log('\n🎯 PRUEBA COMPLETADA');
        console.log('Archivos creados:');
        console.log('- test_export_coches.xlsx (todos los coches)');
        console.log('- test_export_coches_filtrado.xlsx (coches BMW blancos)');
        
    } catch (error) {
        console.error('💥 Error en la prueba:', error);
    } finally {
        db.close();
    }
}

probarExportacion();



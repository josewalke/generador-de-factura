const ImportadorExcel = require('./modules/importadorExcel');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const db = new sqlite3.Database('./database/telwagen.db');

// Crear instancia del importador
const importador = new ImportadorExcel(db);

async function probarImportacion() {
    try {
        console.log('🧪 Iniciando prueba de importación...');
        
        const filePath = path.join(__dirname, 'test_coches_simple.xlsx');
        console.log('📁 Archivo a importar:', filePath);
        
        const resultado = await importador.importarCoches(filePath);
        
        console.log('\n📊 RESULTADO DE LA IMPORTACIÓN:');
        console.log('================================');
        console.log('✅ Éxito:', resultado.success);
        console.log('📈 Total filas:', resultado.total);
        console.log('✅ Importados:', resultado.importados);
        console.log('❌ Errores:', resultado.errores);
        
        if (resultado.erroresDetalle && resultado.erroresDetalle.length > 0) {
            console.log('\n🔍 ERRORES DETALLADOS:');
            console.log('======================');
            resultado.erroresDetalle.forEach(error => {
                console.log(`Fila ${error.fila}: ${error.error}`);
                console.log('Datos:', error.datos);
                console.log('---');
            });
        }
        
        if (resultado.error) {
            console.log('\n❌ ERROR GENERAL:', resultado.error);
        }
        
    } catch (error) {
        console.error('💥 Error en la prueba:', error);
    } finally {
        db.close();
    }
}

probarImportacion();



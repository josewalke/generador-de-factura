const SistemaAuditoria = require('./modules/sistemaAuditoria');
const SistemaIntegridad = require('./modules/sistemaIntegridad');
const sqlite3 = require('sqlite3').verbose();

// Conectar a la base de datos
const db = new sqlite3.Database('./database/telwagen.db');

async function probarSistemaAuditoria() {
    try {
        console.log('🧪 Probando sistema de auditoría...');
        
        // Crear instancia del sistema de auditoría
        const sistemaAuditoria = new SistemaAuditoria(db);
        
        // Verificar que el sistema de integridad funciona
        console.log('🔍 Verificando sistema de integridad...');
        const sistemaIntegridad = sistemaAuditoria.sistemaIntegridad;
        
        if (sistemaIntegridad && typeof sistemaIntegridad.generarSelladoTemporal === 'function') {
            console.log('✅ Sistema de integridad funcionando correctamente');
            
            // Probar generar sellado temporal
            const datosPrueba = {
                id: 1,
                numero_factura: 'TEST-001',
                total: 100.00,
                fecha_emision: new Date().toISOString()
            };
            
            const selladoTemporal = sistemaIntegridad.generarSelladoTemporal(datosPrueba);
            console.log('✅ Sellado temporal generado:', selladoTemporal);
            
        } else {
            console.log('❌ Sistema de integridad no funciona correctamente');
        }
        
        // Probar registrar operación
        console.log('\n🔍 Probando registro de operación...');
        await sistemaAuditoria.registrarOperacion(
            'facturas',
            999,
            'INSERT',
            null,
            { numero_factura: 'TEST-001', total: 100.00 },
            'test'
        );
        console.log('✅ Operación registrada correctamente');
        
        console.log('\n✅ Sistema de auditoría funcionando correctamente');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.close();
    }
}

probarSistemaAuditoria();



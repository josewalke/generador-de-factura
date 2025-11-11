// Script para eliminar todas las tablas
const { Pool } = require('pg');
const config = require('./config/config');

const pgConfig = {
    host: config.get('database.host') || 'localhost',
    port: config.get('database.port') || 5432,
    database: config.get('database.database') || 'telwagen',
    user: config.get('database.user') || 'postgres',
    password: config.get('database.password') || ''
};

async function limpiarTablas() {
    const pool = new Pool(pgConfig);
    
    try {
        console.log('Eliminando todas las tablas...');
        const tablas = [
            'sellados_temporales',
            'audit_log',
            'detalles_factura',
            'facturas',
            'productos',
            'coches',
            'clientes',
            'usuarios',
            'empresas'
        ];
        
        for (const tabla of tablas) {
            try {
                await pool.query(`DROP TABLE IF EXISTS ${tabla} CASCADE`);
                console.log(`✅ Tabla ${tabla} eliminada`);
            } catch (error) {
                console.log(`⚠️  ${tabla}: ${error.message}`);
            }
        }
        
        console.log('\n✅ Todas las tablas eliminadas. Puedes ejecutar la migración ahora.');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

limpiarTablas();


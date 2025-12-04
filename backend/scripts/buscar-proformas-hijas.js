const path = require('path');
const config = require('../config/config');

const dbType = config.get('database.type') || 'postgresql';

async function buscarProformasHijas() {
    try {
        if (dbType === 'postgresql') {
            const { Pool } = require('pg');
            const pool = new Pool({
                host: config.get('database.host'),
                port: config.get('database.port'),
                database: config.get('database.database'),
                user: config.get('database.user'),
                password: config.get('database.password'),
            });
            
            console.log('✅ Conectado a PostgreSQL');
            
            // Buscar todas las proformas creadas hoy o recientemente
            const result = await pool.query(`
                SELECT id, numero_proforma, estado, fecha_creacion,
                       (SELECT COUNT(*) FROM detalles_proforma dp WHERE dp.proforma_id = proformas.id AND dp.coche_id IS NOT NULL) as coches_count,
                       (SELECT COUNT(*) FROM detalles_proforma dp WHERE dp.proforma_id = proformas.id) as total_detalles
                FROM proformas 
                WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '7 days'
                ORDER BY fecha_creacion DESC, id DESC
            `);
            
            console.log('\n📋 Proformas recientes (últimos 7 días):');
            result.rows.forEach(p => {
                console.log(`  ID: ${p.id}, Numero: ${p.numero_proforma}, Estado: ${p.estado}, Coches: ${p.coches_count}, Total detalles: ${p.total_detalles}, Fecha: ${p.fecha_creacion}`);
            });
            
            // Buscar proformas que mencionen "Dividida" en las notas
            const result2 = await pool.query(`
                SELECT id, numero_proforma, estado, notas
                FROM proformas 
                WHERE notas LIKE '%Dividida%' OR notas LIKE '%dividida%'
                ORDER BY id DESC
            `);
            
            if (result2.rows.length > 0) {
                console.log('\n📝 Proformas con notas de división:');
                result2.rows.forEach(p => {
                    console.log(`  ID: ${p.id}, Numero: ${p.numero_proforma}, Estado: ${p.estado}`);
                    console.log(`     Notas: ${p.notas?.substring(0, 100)}...`);
                });
            }
            
            await pool.end();
        }
        
        console.log('\n✅ Búsqueda completada');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

buscarProformasHijas();


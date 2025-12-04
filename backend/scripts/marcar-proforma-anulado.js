const path = require('path');
const config = require('../config/config');

const dbType = config.get('database.type') || 'postgresql';

async function marcarProformaAnulado() {
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
            
            // Buscar la proforma PRO-TEC001/2025
            const result = await pool.query(`
                SELECT id, numero_proforma, estado
                FROM proformas 
                WHERE numero_proforma = 'PRO-TEC001/2025'
            `);
            
            if (result.rows.length === 0) {
                console.log('❌ No se encontró la proforma PRO-TEC001/2025');
                await pool.end();
                process.exit(1);
            }
            
            const proforma = result.rows[0];
            console.log(`\n📋 Proforma encontrada:`);
            console.log(`   ID: ${proforma.id}`);
            console.log(`   Numero: ${proforma.numero_proforma}`);
            console.log(`   Estado actual: ${proforma.estado}`);
            
            // Verificar si hay proformas hijas
            const hijas = await pool.query(`
                SELECT id, numero_proforma, estado
                FROM proformas 
                WHERE notas LIKE '%Dividida de PRO-TEC001/2025%'
            `);
            
            if (hijas.rows.length > 0) {
                console.log(`\n📦 Proformas hijas encontradas: ${hijas.rows.length}`);
                hijas.rows.forEach(h => {
                    console.log(`   - ${h.numero_proforma} (ID: ${h.id})`);
                });
                
                // Actualizar el estado a "anulado"
                await pool.query('UPDATE proformas SET estado = $1 WHERE id = $2', ['anulado', proforma.id]);
                console.log(`\n✅ Estado de la proforma ${proforma.numero_proforma} actualizado a "anulado"`);
            } else {
                console.log('\n⚠️  No se encontraron proformas hijas. La proforma no ha sido dividida.');
            }
            
            await pool.end();
        }
        
        console.log('\n✅ Proceso completado');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

marcarProformaAnulado();


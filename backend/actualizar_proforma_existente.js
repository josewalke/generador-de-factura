// Script para actualizar el estado de una proforma existente basándose en las facturas
const config = require('./config/config');

const dbType = config.get('database.type') || 'postgresql';

async function actualizarProforma() {
    let pool;
    
    try {
        if (dbType === 'postgresql') {
            const { Pool } = require('pg');
            pool = new Pool({
                host: config.get('database.host') || 'localhost',
                port: config.get('database.port') || 5432,
                database: config.get('database.database') || 'telwagen',
                user: config.get('database.user') || 'postgres',
                password: config.get('database.password') || '',
            });
            
            console.log('🔄 Actualizando estado de proformas basándose en facturas...\n');
            
            // Obtener todas las proformas activas
            const proformas = await pool.query(`
                SELECT id, numero_proforma, estado, cliente_id, empresa_id
                FROM proformas
                WHERE estado NOT IN ('anulado', 'cancelada')
                  AND (activo = true OR activo IS NULL)
                ORDER BY fecha_emision DESC
            `);
            
            console.log(`📋 Proformas encontradas: ${proformas.rows.length}\n`);
            
            for (const proforma of proformas.rows) {
                console.log('='.repeat(70));
                console.log(`📋 Proforma: ${proforma.numero_proforma} (ID: ${proforma.id})`);
                console.log(`   Estado actual: ${proforma.estado || 'pendiente'}`);
                console.log(`   Cliente ID: ${proforma.cliente_id || 'null'}`);
                console.log(`   Empresa ID: ${proforma.empresa_id}\n`);
                
                // Contar coches en la proforma
                const totalCoches = await pool.query(`
                    SELECT COUNT(DISTINCT coche_id) as total
                    FROM detalles_proforma
                    WHERE proforma_id = $1
                      AND coche_id IS NOT NULL
                `, [proforma.id]);
                
                const total = parseInt(totalCoches.rows[0]?.total || 0);
                console.log(`   Total coches en proforma: ${total}`);
                
                if (total === 0) {
                    console.log(`   ⚠️  No hay coches en esta proforma, saltando...\n`);
                    continue;
                }
                
                // Contar coches facturados
                const cochesFacturados = await pool.query(`
                    SELECT COUNT(DISTINCT dp.coche_id) as total_facturados
                    FROM detalles_proforma dp
                    WHERE dp.proforma_id = $1
                      AND dp.coche_id IS NOT NULL
                      AND EXISTS (
                          SELECT 1 
                          FROM detalles_factura df
                          INNER JOIN facturas f ON df.factura_id = f.id
                          WHERE df.coche_id = dp.coche_id
                            AND (f.estado IS NULL OR f.estado != 'anulado')
                            AND (f.activo = true OR f.activo IS NULL)
                      )
                `, [proforma.id]);
                
                const facturados = parseInt(cochesFacturados.rows[0]?.total_facturados || 0);
                console.log(`   Coches facturados: ${facturados}`);
                
                // Determinar nuevo estado
                let nuevoEstado = null;
                if (facturados === total && total > 0) {
                    nuevoEstado = 'facturada';
                    console.log(`   ✅ Estado debería ser: facturada`);
                } else if (facturados > 0 && facturados < total) {
                    nuevoEstado = 'semifacturado';
                    console.log(`   ⚠️  Estado debería ser: semifacturado`);
                } else {
                    nuevoEstado = 'pendiente';
                    console.log(`   ℹ️  Estado debería ser: pendiente`);
                }
                
                // Actualizar si es necesario
                if (nuevoEstado && nuevoEstado !== proforma.estado) {
                    console.log(`   🔄 Actualizando estado de '${proforma.estado || 'pendiente'}' a '${nuevoEstado}'...`);
                    await pool.query(`
                        UPDATE proformas 
                        SET estado = $1
                        WHERE id = $2
                    `, [nuevoEstado, proforma.id]);
                    console.log(`   ✅ Estado actualizado a '${nuevoEstado}'\n`);
                } else {
                    console.log(`   ✅ Estado ya es correcto\n`);
                }
            }
            
            await pool.end();
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        if (pool) await pool.end();
        process.exit(1);
    }
}

actualizarProforma();




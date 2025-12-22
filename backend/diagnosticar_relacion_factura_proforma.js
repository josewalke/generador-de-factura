// Script para diagnosticar la relación entre facturas y proformas
const config = require('./config/config');

const dbType = config.get('database.type') || 'postgresql';

async function diagnosticar() {
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
            
            console.log('🔍 Diagnosticando relación factura-proforma...\n');
            
            // Obtener todas las facturas recientes
            const facturas = await pool.query(`
                SELECT id, numero_factura, cliente_id, empresa_id, estado, fecha_emision
                FROM facturas
                WHERE (estado IS NULL OR estado != 'anulado')
                  AND (activo = true OR activo IS NULL)
                ORDER BY fecha_emision DESC
                LIMIT 10
            `);
            
            console.log(`📄 Facturas encontradas: ${facturas.rows.length}\n`);
            
            for (const factura of facturas.rows) {
                console.log('='.repeat(70));
                console.log(`📄 Factura: ${factura.numero_factura} (ID: ${factura.id})`);
                console.log(`   Cliente ID: ${factura.cliente_id}`);
                console.log(`   Empresa ID: ${factura.empresa_id}`);
                console.log(`   Estado: ${factura.estado || 'pendiente'}\n`);
                
                // Obtener coches de la factura
                const cochesFactura = await pool.query(`
                    SELECT DISTINCT coche_id, descripcion
                    FROM detalles_factura
                    WHERE factura_id = $1
                      AND coche_id IS NOT NULL
                `, [factura.id]);
                
                console.log(`🚗 Coches en la factura: ${cochesFactura.rows.length}`);
                if (cochesFactura.rows.length > 0) {
                    cochesFactura.rows.forEach((row, index) => {
                        console.log(`   ${index + 1}. Coche ID: ${row.coche_id} - ${row.descripcion || 'N/A'}`);
                    });
                } else {
                    console.log(`   ⚠️  No se encontraron coches en detalles_factura`);
                }
                console.log('');
                
                if (cochesFactura.rows.length > 0) {
                    // Buscar proformas relacionadas solo por coches (sin filtrar por cliente/empresa)
                    const cocheIds = cochesFactura.rows.map(r => r.coche_id);
                    const placeholders = cocheIds.map((_, i) => `$${i + 1}`).join(',');
                    const params = [...cocheIds];
                    
                    const proformas = await pool.query(`
                        SELECT DISTINCT p.id, p.numero_proforma, p.estado, p.cliente_id, p.empresa_id,
                               COUNT(DISTINCT dp.coche_id) as total_coches_proforma,
                               COUNT(DISTINCT CASE 
                                   WHEN EXISTS (
                                       SELECT 1 
                                       FROM detalles_factura df
                                       INNER JOIN facturas f ON df.factura_id = f.id
                                       WHERE df.coche_id = dp.coche_id
                                         AND (f.estado IS NULL OR f.estado != 'anulado')
                                         AND (f.activo = true OR f.activo IS NULL)
                                   ) THEN dp.coche_id 
                               END) as coches_facturados
                        FROM proformas p
                        INNER JOIN detalles_proforma dp ON dp.proforma_id = p.id
                        WHERE dp.coche_id IN (${placeholders})
                          AND dp.coche_id IS NOT NULL
                          AND p.estado NOT IN ('anulado', 'cancelada')
                        GROUP BY p.id, p.numero_proforma, p.estado, p.cliente_id, p.empresa_id
                    `, params);
                    
                    console.log(`📋 Proformas relacionadas encontradas: ${proformas.rows.length}`);
                    if (proformas.rows.length > 0) {
                        proformas.rows.forEach((proforma, index) => {
                            console.log(`\n   ${index + 1}. Proforma: ${proforma.numero_proforma} (ID: ${proforma.id})`);
                            console.log(`      Estado actual: ${proforma.estado || 'pendiente'}`);
                            console.log(`      Cliente ID: ${proforma.cliente_id}`);
                            console.log(`      Empresa ID: ${proforma.empresa_id}`);
                            console.log(`      Total coches: ${proforma.total_coches_proforma}`);
                            console.log(`      Coches facturados: ${proforma.coches_facturados}`);
                            
                            const totalCoches = parseInt(proforma.total_coches_proforma) || 0;
                            const cochesFacturados = parseInt(proforma.coches_facturados) || 0;
                            
                            if (cochesFacturados === totalCoches && totalCoches > 0) {
                                console.log(`      ✅ Estado debería ser: facturada`);
                            } else if (cochesFacturados > 0 && cochesFacturados < totalCoches) {
                                console.log(`      ⚠️  Estado debería ser: semifacturado`);
                            } else {
                                console.log(`      ℹ️  Estado debería ser: pendiente`);
                            }
                        });
                    } else {
                        console.log(`   ⚠️  No se encontraron proformas relacionadas`);
                    }
                } else {
                    console.log(`   ⚠️  La factura no tiene coches asociados`);
                }
                console.log('');
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

diagnosticar();


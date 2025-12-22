// Script para actualizar el estado de las proformas según los coches facturados
const config = require('./config/config');

const dbType = config.get('database.type') || 'postgresql';

async function actualizarEstadosProformas() {
    let db;
    let pool;
    
    try {
        console.log('🔄 Actualizando estados de proformas según coches facturados...');
        console.log('📊 Tipo de base de datos:', dbType.toUpperCase());
        console.log('='.repeat(70));

        if (dbType === 'postgresql') {
            const { Pool } = require('pg');
            pool = new Pool({
                host: config.get('database.host') || 'localhost',
                port: config.get('database.port') || 5432,
                database: config.get('database.database') || 'telwagen',
                user: config.get('database.user') || 'postgres',
                password: config.get('database.password') || '',
            });
            
            console.log('✅ Conectado a PostgreSQL');
            
            // Obtener todas las proformas que no estén anuladas o canceladas
            const proformas = await pool.query(`
                SELECT DISTINCT p.id, p.numero_proforma, p.estado, p.cliente_id, p.empresa_id
                FROM proformas p
                WHERE p.estado NOT IN ('anulado', 'cancelada')
                ORDER BY p.id
            `);
            
            console.log(`\n📋 Encontradas ${proformas.rows.length} proformas para evaluar\n`);
            
            let actualizadas = 0;
            
            for (const proforma of proformas.rows) {
                // Contar total de coches en la proforma
                const totalCochesResult = await pool.query(`
                    SELECT COUNT(DISTINCT dp.coche_id) as total
                    FROM detalles_proforma dp
                    WHERE dp.proforma_id = $1 AND dp.coche_id IS NOT NULL
                `, [proforma.id]);
                
                const totalCoches = parseInt(totalCochesResult.rows[0]?.total || 0);
                
                if (totalCoches === 0) {
                    console.log(`ℹ️  Proforma ${proforma.numero_proforma} (ID: ${proforma.id}) - Sin coches, se mantiene como ${proforma.estado}`);
                    continue;
                }
                
                // Contar coches facturados (en cualquier factura no anulada)
                const cochesFacturadosResult = await pool.query(`
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
                
                const cochesFacturados = parseInt(cochesFacturadosResult.rows[0]?.total_facturados || 0);
                
                console.log(`🔍 Proforma ${proforma.numero_proforma} (ID: ${proforma.id}):`);
                console.log(`   - Estado actual: ${proforma.estado}`);
                console.log(`   - Total coches: ${totalCoches}`);
                console.log(`   - Coches facturados: ${cochesFacturados}`);
                
                let nuevoEstado = null;
                
                if (cochesFacturados === totalCoches && totalCoches > 0) {
                    // Todos los coches están facturados
                    nuevoEstado = 'facturada';
                } else if (cochesFacturados > 0 && cochesFacturados < totalCoches) {
                    // Solo algunos coches están facturados
                    nuevoEstado = 'semifacturado';
                } else {
                    // Ningún coche está facturado
                    nuevoEstado = 'pendiente';
                }
                
                // Solo actualizar si el estado es diferente
                if (nuevoEstado && nuevoEstado !== proforma.estado) {
                    await pool.query(`
                        UPDATE proformas 
                        SET estado = $1
                        WHERE id = $2
                    `, [nuevoEstado, proforma.id]);
                    
                    console.log(`   ✅ Actualizada de '${proforma.estado}' a '${nuevoEstado}'`);
                    actualizadas++;
                } else {
                    console.log(`   ℹ️  Estado correcto: ${proforma.estado}`);
                }
                console.log('');
            }
            
            console.log('='.repeat(70));
            console.log(`✅ Proceso completado: ${actualizadas} proforma(s) actualizada(s)`);
            console.log('='.repeat(70));
            
            await pool.end();

        } else {
            // SQLite
            const sqlite3 = require('sqlite3').verbose();
            const path = require('path');
            const dbPath = config.get('database.path') || path.join(__dirname, 'database/telwagen.db');
            
            console.log('📁 Base de datos SQLite:', dbPath);
            
            db = new sqlite3.Database(dbPath);

            // Obtener todas las proformas
            const proformas = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT DISTINCT p.id, p.numero_proforma, p.estado, p.cliente_id, p.empresa_id
                    FROM proformas p
                    WHERE p.estado NOT IN ('anulado', 'cancelada')
                    ORDER BY p.id
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });
            
            console.log(`\n📋 Encontradas ${proformas.length} proformas para evaluar\n`);
            
            let actualizadas = 0;
            
            for (const proforma of proformas) {
                // Contar total de coches en la proforma
                const totalCoches = await new Promise((resolve, reject) => {
                    db.get(`
                        SELECT COUNT(DISTINCT dp.coche_id) as total
                        FROM detalles_proforma dp
                        WHERE dp.proforma_id = ? AND dp.coche_id IS NOT NULL
                    `, [proforma.id], (err, row) => {
                        if (err) reject(err);
                        else resolve(parseInt(row?.total || 0));
                    });
                });
                
                if (totalCoches === 0) {
                    console.log(`ℹ️  Proforma ${proforma.numero_proforma} (ID: ${proforma.id}) - Sin coches, se mantiene como ${proforma.estado}`);
                    continue;
                }
                
                // Contar coches facturados
                const cochesFacturados = await new Promise((resolve, reject) => {
                    db.get(`
                        SELECT COUNT(DISTINCT dp.coche_id) as total_facturados
                        FROM detalles_proforma dp
                        WHERE dp.proforma_id = ? 
                          AND dp.coche_id IS NOT NULL
                          AND EXISTS (
                              SELECT 1 
                              FROM detalles_factura df
                              INNER JOIN facturas f ON df.factura_id = f.id
                              WHERE df.coche_id = dp.coche_id
                                AND (f.estado IS NULL OR f.estado != 'anulado')
                                AND (f.activo = 1 OR f.activo IS NULL)
                          )
                    `, [proforma.id], (err, row) => {
                        if (err) reject(err);
                        else resolve(parseInt(row?.total_facturados || 0));
                    });
                });
                
                console.log(`🔍 Proforma ${proforma.numero_proforma} (ID: ${proforma.id}):`);
                console.log(`   - Estado actual: ${proforma.estado}`);
                console.log(`   - Total coches: ${totalCoches}`);
                console.log(`   - Coches facturados: ${cochesFacturados}`);
                
                let nuevoEstado = null;
                
                if (cochesFacturados === totalCoches && totalCoches > 0) {
                    nuevoEstado = 'facturada';
                } else if (cochesFacturados > 0 && cochesFacturados < totalCoches) {
                    nuevoEstado = 'semifacturado';
                } else {
                    nuevoEstado = 'pendiente';
                }
                
                // Solo actualizar si el estado es diferente
                if (nuevoEstado && nuevoEstado !== proforma.estado) {
                    await new Promise((resolve, reject) => {
                        db.run(`
                            UPDATE proformas 
                            SET estado = ?
                            WHERE id = ?
                        `, [nuevoEstado, proforma.id], function(err) {
                            if (err) reject(err);
                            else {
                                console.log(`   ✅ Actualizada de '${proforma.estado}' a '${nuevoEstado}'`);
                                actualizadas++;
                                resolve();
                            }
                        });
                    });
                } else {
                    console.log(`   ℹ️  Estado correcto: ${proforma.estado}`);
                }
                console.log('');
            }
            
            console.log('='.repeat(70));
            console.log(`✅ Proceso completado: ${actualizadas} proforma(s) actualizada(s)`);
            console.log('='.repeat(70));
            
            db.close();
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante la actualización:', error.message);
        console.error(error.stack);
        if (pool) await pool.end();
        if (db) db.close();
        process.exit(1);
    }
}

actualizarEstadosProformas();


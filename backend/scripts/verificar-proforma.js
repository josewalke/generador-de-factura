const path = require('path');
const config = require('../config/config');

const dbType = config.get('database.type') || 'postgresql';

async function verificarProforma() {
    let db;
    
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
            
            // Buscar proformas PRO-TEC001
            const result = await pool.query(`
                SELECT id, numero_proforma, estado, 
                       (SELECT COUNT(*) FROM detalles_proforma dp WHERE dp.proforma_id = proformas.id AND dp.coche_id IS NOT NULL) as coches_count
                FROM proformas 
                WHERE numero_proforma LIKE 'PRO-TEC001%' 
                ORDER BY id
            `);
            
            console.log('\n📋 Proformas encontradas:');
            result.rows.forEach(p => {
                console.log(`  ID: ${p.id}, Numero: ${p.numero_proforma}, Estado: ${p.estado}, Coches: ${p.coches_count}`);
            });
            
            // Buscar la proforma original (la que tiene múltiples coches o fue dividida)
            const original = result.rows.find(p => p.numero_proforma === 'PRO-TEC001/2025');
            if (original) {
                console.log(`\n🔍 Proforma original encontrada: ${original.numero_proforma}`);
                console.log(`   Estado actual: ${original.estado}`);
                console.log(`   Coches: ${original.coches_count}`);
                
                // Verificar si hay proformas hijas (las que fueron creadas al dividir)
                const hijas = result.rows.filter(p => p.numero_proforma !== 'PRO-TEC001/2025');
                if (hijas.length > 0) {
                    console.log(`\n📦 Proformas hijas encontradas: ${hijas.length}`);
                    hijas.forEach(h => {
                        console.log(`   - ${h.numero_proforma} (Estado: ${h.estado}, Coches: ${h.coches_count})`);
                    });
                    
                    // Si hay hijas y la original no está anulada, actualizarla
                    if (original.estado !== 'anulado') {
                        console.log('\n⚠️  La proforma original no está marcada como "anulado"');
                        console.log('   Actualizando estado...');
                        
                        await pool.query('UPDATE proformas SET estado = $1 WHERE id = $2', ['anulado', original.id]);
                        console.log('✅ Estado actualizado a "anulado"');
                    } else {
                        console.log('\n✅ La proforma original ya está marcada como "anulado"');
                    }
                } else {
                    console.log('\n⚠️  No se encontraron proformas hijas. La proforma no ha sido dividida.');
                }
            }
            
            await pool.end();
        } else {
            const sqlite3 = require('sqlite3').verbose();
            const dbPath = config.get('database.path') || path.join(__dirname, '../database/telwagen.db');
            db = new sqlite3.Database(dbPath);
            
            // Similar lógica para SQLite
            await new Promise((resolve, reject) => {
                db.all(`
                    SELECT id, numero_proforma, estado,
                           (SELECT COUNT(*) FROM detalles_proforma dp WHERE dp.proforma_id = proformas.id AND dp.coche_id IS NOT NULL) as coches_count
                    FROM proformas 
                    WHERE numero_proforma LIKE 'PRO-TEC001%'
                    ORDER BY id
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            }).then(rows => {
                console.log('\n📋 Proformas encontradas:');
                rows.forEach(p => {
                    console.log(`  ID: ${p.id}, Numero: ${p.numero_proforma}, Estado: ${p.estado}, Coches: ${p.coches_count}`);
                });
                
                const original = rows.find(p => p.numero_proforma === 'PRO-TEC001/2025');
                if (original) {
                    const hijas = rows.filter(p => p.numero_proforma !== 'PRO-TEC001/2025');
                    if (hijas.length > 0 && original.estado !== 'anulado') {
                        db.run('UPDATE proformas SET estado = ? WHERE id = ?', ['anulado', original.id], (err) => {
                            if (err) console.error('Error:', err);
                            else console.log('✅ Estado actualizado a "anulado"');
                            db.close();
                        });
                    } else {
                        db.close();
                    }
                } else {
                    db.close();
                }
            });
        }
        
        console.log('\n✅ Verificación completada');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (db && db.close) db.close();
        process.exit(1);
    }
}

verificarProforma();


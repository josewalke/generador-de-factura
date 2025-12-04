const path = require('path');
const config = require('../config/config');

console.log('🗑️  Iniciando eliminación de todas las proformas...');

const dbType = config.get('database.type') || 'postgresql';

async function eliminarTodasProformas() {
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
            
            // Eliminar detalles_proforma
            const result1 = await pool.query('DELETE FROM detalles_proforma');
            console.log(`✅ Eliminados ${result1.rowCount} registros de detalles_proforma`);
            
            // Eliminar proformas
            const result2 = await pool.query('DELETE FROM proformas');
            console.log(`✅ Eliminadas ${result2.rowCount} proformas`);
            
            // Intentar limpiar numero_proforma en coches si existe
            try {
                const result3 = await pool.query("UPDATE coches SET numero_proforma = NULL WHERE numero_proforma IS NOT NULL");
                console.log(`✅ Limpiados ${result3.rowCount} registros de numero_proforma en coches`);
            } catch (err) {
                if (!err.message.includes('column') && !err.message.includes('does not exist')) {
                    console.warn('⚠️  No se pudo limpiar numero_proforma en coches:', err.message);
                }
            }
            
            await pool.end();
        } else {
            const sqlite3 = require('sqlite3').verbose();
            const dbPath = config.get('database.path') || path.join(__dirname, '../database/telwagen.db');
            
            console.log('📁 Base de datos SQLite:', dbPath);
            
            db = new sqlite3.Database(dbPath);
            
            // Eliminar detalles_proforma
            await new Promise((resolve, reject) => {
                db.run('DELETE FROM detalles_proforma', function(err) {
                    if (err) reject(err);
                    else {
                        console.log(`✅ Eliminados ${this.changes} registros de detalles_proforma`);
                        resolve();
                    }
                });
            });
            
            // Eliminar proformas
            await new Promise((resolve, reject) => {
                db.run('DELETE FROM proformas', function(err) {
                    if (err) reject(err);
                    else {
                        console.log(`✅ Eliminadas ${this.changes} proformas`);
                        resolve();
                    }
                });
            });
            
            // Intentar limpiar numero_proforma en coches si existe
            await new Promise((resolve) => {
                db.run("UPDATE coches SET numero_proforma = NULL WHERE numero_proforma IS NOT NULL", function(err) {
                    if (err && !err.message.includes('no such column')) {
                        console.warn('⚠️  No se pudo limpiar numero_proforma en coches:', err.message);
                    } else if (!err) {
                        console.log(`✅ Limpiados ${this.changes} registros de numero_proforma en coches`);
                    }
                    resolve();
                });
            });
            
            db.close();
        }
        
        console.log('\n✅ Proceso completado exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (db && db.close) db.close();
        process.exit(1);
    }
}

eliminarTodasProformas();


/**
 * Script para corregir marca y modelo en la tabla coches
 * Extrae la marca del campo modelo y actualiza ambos campos
 * 
 * Ejecutar desde el directorio raíz del proyecto:
 *    node backend/scripts/corregir-marca-modelo.js
 */

const path = require('path');
const config = require('../config/config');
const database = require('../modules/database');
const sqlite3 = require('sqlite3').verbose();

// Configurar la ruta de la base de datos
const dbType = config.database?.type || 'postgresql';

async function corregirMarcaModelo() {
    let db;
    
    try {
        if (dbType === 'postgresql') {
            await database.connect();
            db = database;
            
            console.log('📊 Conectado a PostgreSQL');
            
            // Primero, asegurar que la columna marca existe
            try {
                await db.query('ALTER TABLE coches ADD COLUMN IF NOT EXISTS marca TEXT');
                console.log('✅ Columna marca verificada/creada');
            } catch (err) {
                if (!err.message.includes('already exists') && !err.message.includes('duplicate column')) {
                    console.warn('⚠️ Advertencia al crear columna marca:', err.message);
                }
            }
            
            // Primero, ver cuántos registros necesitan corrección
            const countResult = await db.query(`
                SELECT COUNT(*) as total
                FROM coches
                WHERE (marca IS NULL OR marca = '' OR marca = 'N/A') 
                  AND modelo IS NOT NULL 
                  AND modelo != ''
                  AND TRIM(modelo) != ''
            `);
            
            const total = countResult.rows[0]?.total || 0;
            console.log(`📋 Registros a corregir: ${total}`);
            
            if (total === 0) {
                console.log('✅ No hay registros que corregir');
                await database.close();
                return;
            }
            
            // Mostrar algunos ejemplos antes de la corrección
            const ejemplos = await db.query(`
                SELECT id, matricula, modelo, marca
                FROM coches
                WHERE (marca IS NULL OR marca = '' OR marca = 'N/A') 
                  AND modelo IS NOT NULL 
                  AND modelo != ''
                  AND TRIM(modelo) != ''
                LIMIT 5
            `);
            
            console.log('\n📝 Ejemplos de registros antes de la corrección:');
            ejemplos.rows.forEach(row => {
                console.log(`  - ID: ${row.id}, Matrícula: ${row.matricula}, Modelo: "${row.modelo}", Marca: "${row.marca || 'NULL'}"`);
            });
            
            // Actualizar marca y modelo
            const updateResult = await db.query(`
                UPDATE coches
                SET marca = TRIM(SPLIT_PART(modelo, ' ', 1)),
                    modelo = CASE 
                        WHEN POSITION(' ' IN modelo) > 0 
                        THEN TRIM(SUBSTRING(modelo FROM POSITION(' ' IN modelo) + 1))
                        ELSE modelo
                    END
                WHERE (marca IS NULL OR marca = '' OR marca = 'N/A') 
                  AND modelo IS NOT NULL 
                  AND modelo != ''
                  AND TRIM(modelo) != ''
            `);
            
            console.log(`\n✅ Actualizados ${updateResult.rowCount || 0} registros`);
            
            // Mostrar ejemplos después de la corrección
            const ejemplosDespues = await db.query(`
                SELECT id, matricula, modelo, marca
                FROM coches
                WHERE id IN (${ejemplos.rows.map(r => r.id).join(',')})
                ORDER BY id
            `);
            
            console.log('\n📝 Ejemplos de registros después de la corrección:');
            ejemplosDespues.rows.forEach(row => {
                console.log(`  - ID: ${row.id}, Matrícula: ${row.matricula}, Marca: "${row.marca}", Modelo: "${row.modelo}"`);
            });
            
            await database.close();
            console.log('\n✅ Corrección completada exitosamente');
            
        } else {
            // SQLite
            const dbPath = config.database?.path || path.join(__dirname, '../data/database.db');
            
            db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    console.error('❌ Error al conectar con SQLite:', err.message);
                    process.exit(1);
                }
            });
            
            console.log('📊 Conectado a SQLite');
            
            // Asegurar que la columna marca existe
            db.run('ALTER TABLE coches ADD COLUMN marca TEXT', (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.warn('⚠️ Advertencia al crear columna marca:', err.message);
                } else {
                    console.log('✅ Columna marca verificada/creada');
                }
            });
            
            // Contar registros a corregir
            db.get(`
                SELECT COUNT(*) as total
                FROM coches
                WHERE (marca IS NULL OR marca = '' OR marca = 'N/A') 
                  AND modelo IS NOT NULL 
                  AND modelo != ''
                  AND TRIM(modelo) != ''
            `, [], async (err, row) => {
                if (err) {
                    console.error('❌ Error al contar registros:', err.message);
                    db.close();
                    process.exit(1);
                }
                
                const total = row?.total || 0;
                console.log(`📋 Registros a corregir: ${total}`);
                
                if (total === 0) {
                    console.log('✅ No hay registros que corregir');
                    db.close();
                    return;
                }
                
                // Mostrar ejemplos
                db.all(`
                    SELECT id, matricula, modelo, marca
                    FROM coches
                    WHERE (marca IS NULL OR marca = '' OR marca = 'N/A') 
                      AND modelo IS NOT NULL 
                      AND modelo != ''
                      AND TRIM(modelo) != ''
                    LIMIT 5
                `, [], (err, ejemplos) => {
                    if (err) {
                        console.error('❌ Error al obtener ejemplos:', err.message);
                        db.close();
                        process.exit(1);
                    }
                    
                    console.log('\n📝 Ejemplos de registros antes de la corrección:');
                    ejemplos.forEach(row => {
                        console.log(`  - ID: ${row.id}, Matrícula: ${row.matricula}, Modelo: "${row.modelo}", Marca: "${row.marca || 'NULL'}"`);
                    });
                    
                    // Actualizar
                    db.run(`
                        UPDATE coches
                        SET marca = TRIM(SUBSTR(modelo, 1, CASE WHEN INSTR(modelo || ' ', ' ') > 0 THEN INSTR(modelo || ' ', ' ') - 1 ELSE LENGTH(modelo) END)),
                            modelo = CASE 
                                WHEN INSTR(modelo || ' ', ' ') > 0 
                                THEN TRIM(SUBSTR(modelo, INSTR(modelo || ' ', ' ') + 1))
                                ELSE modelo
                            END
                        WHERE (marca IS NULL OR marca = '' OR marca = 'N/A') 
                          AND modelo IS NOT NULL 
                          AND modelo != ''
                          AND TRIM(modelo) != ''
                    `, [], function(err) {
                        if (err) {
                            console.error('❌ Error al actualizar:', err.message);
                            db.close();
                            process.exit(1);
                        }
                        
                        console.log(`\n✅ Actualizados ${this.changes} registros`);
                        
                        // Mostrar ejemplos después
                        const ids = ejemplos.map(e => e.id).join(',');
                        db.all(`
                            SELECT id, matricula, modelo, marca
                            FROM coches
                            WHERE id IN (${ids})
                            ORDER BY id
                        `, [], (err, ejemplosDespues) => {
                            if (err) {
                                console.error('❌ Error al obtener ejemplos después:', err.message);
                                db.close();
                                process.exit(1);
                            }
                            
                            console.log('\n📝 Ejemplos de registros después de la corrección:');
                            ejemplosDespues.forEach(row => {
                                console.log(`  - ID: ${row.id}, Matrícula: ${row.matricula}, Marca: "${row.marca}", Modelo: "${row.modelo}"`);
                            });
                            
                            db.close();
                            console.log('\n✅ Corrección completada exitosamente');
                        });
                    });
                });
            });
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        if (db && db.close) {
            await db.close();
        }
        process.exit(1);
    }
}

// Ejecutar el script
if (require.main === module) {
    console.log('🔄 Iniciando corrección de marca y modelo...\n');
    corregirMarcaModelo().catch(err => {
        console.error('❌ Error fatal:', err);
        process.exit(1);
    });
}

module.exports = { corregirMarcaModelo };


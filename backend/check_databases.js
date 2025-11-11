const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkDatabase(dbPath, name) {
    console.log(`\n=== ${name} ===`);
    console.log(`Ruta: ${dbPath}`);
    
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.log(`❌ Error conectando a ${name}:`, err.message);
                resolve(null);
                return;
            }
            
            console.log(`✅ Conectado a ${name}`);
            
            // Verificar si existe la tabla coches
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='coches'", (err, row) => {
                if (err) {
                    console.log(`❌ Error verificando tabla coches en ${name}:`, err.message);
                    db.close();
                    resolve(null);
                    return;
                }
                
                if (!row) {
                    console.log(`❌ Tabla coches no existe en ${name}`);
                    db.close();
                    resolve(null);
                    return;
                }
                
                console.log(`✅ Tabla coches existe en ${name}`);
                
                // Contar coches
                db.get("SELECT COUNT(*) as total FROM coches", (err, countRow) => {
                    if (err) {
                        console.log(`❌ Error contando coches en ${name}:`, err.message);
                        db.close();
                        resolve(null);
                        return;
                    }
                    
                    console.log(`📊 Total coches en ${name}: ${countRow.total}`);
                    
                    // Verificar índices
                    db.all("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='coches'", (err, indexes) => {
                        if (err) {
                            console.log(`❌ Error verificando índices en ${name}:`, err.message);
                            db.close();
                            resolve(null);
                            return;
                        }
                        
                        console.log(`📋 Índices en tabla coches de ${name}:`);
                        if (indexes.length === 0) {
                            console.log(`   No hay índices`);
                        } else {
                            indexes.forEach(idx => {
                                console.log(`   ${idx.name}: ${idx.sql || 'AUTO-INDEX'}`);
                            });
                        }
                        
                        // Verificar estructura de la tabla
                        db.all("PRAGMA table_info('coches')", (err, columns) => {
                            if (err) {
                                console.log(`❌ Error verificando estructura en ${name}:`, err.message);
                                db.close();
                                resolve(null);
                                return;
                            }
                            
                            console.log(`🏗️ Estructura de tabla coches en ${name}:`);
                            columns.forEach(col => {
                                console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
                            });
                            
                            db.close();
                            resolve({
                                path: dbPath,
                                name: name,
                                totalCoches: countRow.total,
                                indexes: indexes,
                                columns: columns
                            });
                        });
                    });
                });
            });
        });
    });
}

async function main() {
    console.log('🔍 Verificando archivos de base de datos...');
    
    const mainDb = path.resolve(__dirname, 'telwagen.db');
    const databaseDb = path.resolve(__dirname, 'database', 'telwagen.db');
    
    const mainResult = await checkDatabase(mainDb, 'ARCHIVO PRINCIPAL');
    const databaseResult = await checkDatabase(databaseDb, 'ARCHIVO DATABASE');
    
    console.log('\n=== RESUMEN ===');
    console.log(`Archivo principal: ${mainResult ? `${mainResult.totalCoches} coches` : 'No válido'}`);
    console.log(`Archivo database: ${databaseResult ? `${databaseResult.totalCoches} coches` : 'No válido'}`);
    
    if (mainResult && databaseResult) {
        console.log('\n⚠️ AMBOS ARCHIVOS EXISTEN - ESTO PUEDE CAUSAR PROBLEMAS');
        console.log('El servidor podría estar usando el archivo incorrecto.');
    }
}

main().catch(console.error);





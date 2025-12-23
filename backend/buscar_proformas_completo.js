const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Verificar si hay PostgreSQL configurado
const config = require('./config/config');
const dbType = config.get('database.type') || 'postgresql';

console.log('🔍 Buscando proformas en todas las bases de datos...');
console.log('Tipo de BD configurado:', dbType);
console.log('='.repeat(70));

// Función para buscar en SQLite
function buscarEnSQLite(dbPath, nombre) {
    return new Promise((resolve) => {
        if (!fs.existsSync(dbPath)) {
            resolve({ nombre, existe: false, proformas: [] });
            return;
        }

        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                resolve({ nombre, existe: false, error: err.message });
                return;
            }

            // Verificar si existe tabla proformas
            db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='proformas'", (err2, rows2) => {
                if (err2) {
                    resolve({ nombre, existe: true, error: err2.message });
                    db.close();
                    return;
                }

                if (rows2.length > 0) {
                    // Obtener todas las proformas
                    db.all('SELECT id, numero_proforma, cliente_id, empresa_id, fecha_emision, total, estado FROM proformas ORDER BY id', (err3, rows3) => {
                        if (err3) {
                            resolve({ nombre, existe: true, error: err3.message });
                        } else {
                            resolve({ nombre, existe: true, proformas: rows3 || [] });
                        }
                        db.close();
                    });
                } else {
                    resolve({ nombre, existe: true, proformas: [], tablaExiste: false });
                    db.close();
                }
            });
        });
    });
}

// Función para buscar en PostgreSQL
async function buscarEnPostgreSQL() {
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            host: config.get('database.host') || 'localhost',
            port: config.get('database.port') || 5432,
            database: config.get('database.database') || 'telwagen',
            user: config.get('database.user') || 'postgres',
            password: config.get('database.password') || '',
        });

        // Verificar si existe tabla proformas
        const tableCheck = await pool.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'proformas'"
        );

        if (tableCheck.rows.length > 0) {
            // Obtener todas las proformas
            const result = await pool.query(
                'SELECT id, numero_proforma, cliente_id, empresa_id, fecha_emision, total, estado FROM proformas ORDER BY id'
            );
            await pool.end();
            return { nombre: 'PostgreSQL', existe: true, proformas: result.rows || [] };
        } else {
            await pool.end();
            return { nombre: 'PostgreSQL', existe: true, proformas: [], tablaExiste: false };
        }
    } catch (error) {
        return { nombre: 'PostgreSQL', existe: false, error: error.message };
    }
}

async function main() {
    const resultados = [];

    // Buscar en SQLite databases
    const db1Path = path.join(__dirname, 'database', 'telwagen.db');
    const db2Path = path.join(__dirname, 'telwagen.db');

    resultados.push(await buscarEnSQLite(db1Path, 'database/telwagen.db'));
    resultados.push(await buscarEnSQLite(db2Path, 'telwagen.db (raíz)'));

    // Buscar en PostgreSQL si está configurado
    if (dbType === 'postgresql') {
        resultados.push(await buscarEnPostgreSQL());
    }

    // Mostrar resultados
    console.log('\n📊 RESULTADOS:');
    console.log('='.repeat(70));

    let totalProformas = 0;
    resultados.forEach(r => {
        console.log(`\n📁 ${r.nombre}:`);
        if (!r.existe) {
            console.log('   ❌ Base de datos no existe o no accesible');
            if (r.error) {
                console.log(`   Error: ${r.error}`);
            }
        } else {
            if (r.tablaExiste === false) {
                console.log('   ⚠️ Tabla proformas NO EXISTE');
            } else {
                const count = r.proformas ? r.proformas.length : 0;
                totalProformas += count;
                console.log(`   ✅ Proformas encontradas: ${count}`);
                
                if (count > 0) {
                    console.log('\n   Detalles:');
                    r.proformas.forEach((p, i) => {
                        console.log(`      ${i + 1}. ID: ${p.id} | Número: ${p.numero_proforma} | Cliente: ${p.cliente_id} | Empresa: ${p.empresa_id} | Estado: ${p.estado}`);
                    });
                }
            }
        }
    });

    console.log('\n' + '='.repeat(70));
    console.log(`\n📊 RESUMEN TOTAL:`);
    console.log(`   📋 Total de Proformas encontradas: ${totalProformas}`);
    console.log('\n');
}

main().catch(console.error);











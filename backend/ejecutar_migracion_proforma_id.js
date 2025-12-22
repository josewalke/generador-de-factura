// Script para ejecutar la migración de relación facturas-proformas
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const config = require('./config/config');
const path = require('path');

const dbType = config.get('database.type') || 'postgresql';

async function ejecutarMigracionPostgreSQL() {
    const pool = new Pool({
        host: config.get('database.host') || 'localhost',
        port: config.get('database.port') || 5432,
        database: config.get('database.database') || 'telwagen',
        user: config.get('database.user') || 'postgres',
        password: config.get('database.password') || '',
    });

    try {
        console.log('🔍 Verificando si la columna proforma_id existe en facturas...');
        
        // Verificar si la columna ya existe
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'facturas' AND column_name = 'proforma_id'
        `);

        if (checkColumn.rows.length > 0) {
            console.log('✅ La columna proforma_id ya existe en facturas');
        } else {
            console.log('📝 Agregando columna proforma_id a facturas...');
            
            // Agregar columna
            await pool.query('ALTER TABLE facturas ADD COLUMN proforma_id INTEGER');
            console.log('✅ Columna proforma_id agregada exitosamente');
        }

        // Verificar si existe la tabla proformas para agregar foreign key
        const checkProformasTable = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'proformas'
        `);

        if (checkProformasTable.rows.length > 0) {
            // Verificar si el constraint ya existe
            const checkConstraint = await pool.query(`
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'facturas' AND constraint_name = 'fk_facturas_proforma'
            `);

            if (checkConstraint.rows.length === 0) {
                console.log('📝 Agregando foreign key constraint...');
                await pool.query(`
                    ALTER TABLE facturas 
                    ADD CONSTRAINT fk_facturas_proforma 
                    FOREIGN KEY (proforma_id) REFERENCES proformas(id)
                `);
                console.log('✅ Foreign key constraint agregado exitosamente');
            } else {
                console.log('✅ Foreign key constraint ya existe');
            }
        } else {
            console.log('⚠️ Tabla proformas no existe, omitiendo foreign key constraint');
        }

        // Crear índice si no existe
        const checkIndex = await pool.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'facturas' AND indexname = 'idx_facturas_proforma_id'
        `);

        if (checkIndex.rows.length === 0) {
            console.log('📝 Creando índice idx_facturas_proforma_id...');
            await pool.query('CREATE INDEX idx_facturas_proforma_id ON facturas(proforma_id)');
            console.log('✅ Índice creado exitosamente');
        } else {
            console.log('✅ Índice ya existe');
        }

        await pool.end();
        console.log('\n✅ Migración completada exitosamente en PostgreSQL');
    } catch (error) {
        console.error('❌ Error ejecutando migración en PostgreSQL:', error.message);
        await pool.end();
        throw error;
    }
}

function ejecutarMigracionSQLite() {
    return new Promise((resolve, reject) => {
        const dbPath = path.join(__dirname, 'telwagen.db');
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ Error abriendo base de datos SQLite:', err.message);
                reject(err);
                return;
            }

            console.log('🔍 Verificando si la columna proforma_id existe en facturas...');

            // Verificar si la columna existe
            db.all("PRAGMA table_info(facturas)", (err, columns) => {
                if (err) {
                    console.error('❌ Error verificando columnas:', err.message);
                    db.close();
                    reject(err);
                    return;
                }

                const hasProformaId = columns.some(col => col.name === 'proforma_id');

                if (hasProformaId) {
                    console.log('✅ La columna proforma_id ya existe en facturas');
                    db.close();
                    resolve();
                } else {
                    console.log('📝 Agregando columna proforma_id a facturas...');
                    db.run('ALTER TABLE facturas ADD COLUMN proforma_id INTEGER', (err) => {
                        if (err) {
                            console.error('❌ Error agregando columna:', err.message);
                            db.close();
                            reject(err);
                        } else {
                            console.log('✅ Columna proforma_id agregada exitosamente');
                            
                            // Crear índice
                            db.run('CREATE INDEX IF NOT EXISTS idx_facturas_proforma_id ON facturas(proforma_id)', (err) => {
                                if (err) {
                                    console.warn('⚠️ Error creando índice:', err.message);
                                } else {
                                    console.log('✅ Índice creado exitosamente');
                                }
                                db.close();
                                console.log('\n✅ Migración completada exitosamente en SQLite');
                                resolve();
                            });
                        }
                    });
                }
            });
        });
    });
}

async function main() {
    console.log('🚀 Ejecutando migración: Relación facturas-proformas');
    console.log('Tipo de base de datos:', dbType);
    console.log('='.repeat(60));

    try {
        if (dbType === 'postgresql') {
            await ejecutarMigracionPostgreSQL();
        } else {
            await ejecutarMigracionSQLite();
        }
    } catch (error) {
        console.error('\n❌ Error en la migración:', error);
        process.exit(1);
    }
}

main();










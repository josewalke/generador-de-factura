// Script de migración de SQLite a PostgreSQL
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');
const SQLAdapter = require('./modules/sqlAdapter');

// Variable global para ruta SQLite
let sqlitePath = config.get('database.path') || './database/telwagen.db';

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuración PostgreSQL
const pgConfig = {
    host: config.get('database.host') || 'localhost',
    port: config.get('database.port') || 5432,
    database: config.get('database.database') || 'telwagen',
    user: config.get('database.user') || 'postgres',
    password: config.get('database.password') || ''
};

// Lista de tablas a migrar (en orden de dependencias)
const tablas = [
    'empresas',
    'usuarios',
    'clientes',
    'coches',
    'productos',
    'facturas',
    'detalles_factura',
    'audit_log',
    'sellados_temporales'
];

// Esquemas de las tablas (para crear en PostgreSQL)
const esquemas = {
    empresas: `
        CREATE TABLE IF NOT EXISTS empresas (
            id SERIAL PRIMARY KEY,
            nombre TEXT NOT NULL,
            cif TEXT NOT NULL UNIQUE,
            direccion TEXT,
            telefono TEXT,
            email TEXT,
            logo TEXT,
            certificado_thumbprint TEXT,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            activo BOOLEAN DEFAULT true,
            codigo_pais TEXT,
            provincia TEXT,
            pais TEXT,
            codigo_postal TEXT,
            regimen_fiscal TEXT
        )
    `,
    usuarios: `
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            empresa_id INTEGER,
            activo BOOLEAN DEFAULT true,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ultimo_acceso TIMESTAMP,
            FOREIGN KEY (empresa_id) REFERENCES empresas (id)
        )
    `,
    clientes: `
        CREATE TABLE IF NOT EXISTS clientes (
            id SERIAL PRIMARY KEY,
            nombre TEXT NOT NULL,
            direccion TEXT NOT NULL,
            codigo_postal TEXT,
            identificacion TEXT UNIQUE NOT NULL,
            email TEXT,
            telefono TEXT,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            tipo_identificacion TEXT,
            codigo_pais TEXT,
            provincia TEXT,
            pais TEXT,
            regimen_fiscal TEXT
        )
    `,
    coches: `
        CREATE TABLE IF NOT EXISTS coches (
            id SERIAL PRIMARY KEY,
            matricula TEXT UNIQUE NOT NULL,
            chasis TEXT NOT NULL,
            color TEXT NOT NULL,
            kms INTEGER NOT NULL,
            modelo TEXT NOT NULL,
            activo BOOLEAN DEFAULT true,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `,
    productos: `
        CREATE TABLE IF NOT EXISTS productos (
            id SERIAL PRIMARY KEY,
            codigo TEXT,
            descripcion TEXT NOT NULL,
            precio NUMERIC NOT NULL,
            stock INTEGER DEFAULT 0,
            categoria TEXT DEFAULT 'vehiculo',
            activo BOOLEAN DEFAULT true,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `,
    facturas: `
        CREATE TABLE IF NOT EXISTS facturas (
            id SERIAL PRIMARY KEY,
            numero_factura TEXT NOT NULL,
            empresa_id INTEGER NOT NULL,
            cliente_id INTEGER,
            fecha_emision DATE NOT NULL,
            fecha_vencimiento DATE,
            subtotal NUMERIC NOT NULL,
            igic NUMERIC NOT NULL,
            total NUMERIC NOT NULL,
            estado TEXT DEFAULT 'pendiente',
            notas TEXT,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            numero_serie TEXT,
            fecha_operacion DATE,
            tipo_documento TEXT DEFAULT 'factura',
            metodo_pago TEXT,
            referencia_operacion TEXT,
            hash_documento TEXT,
            sellado_temporal TEXT,
            estado_fiscal TEXT,
            codigo_verifactu TEXT,
            respuesta_aeat TEXT,
            FOREIGN KEY (empresa_id) REFERENCES empresas (id),
            FOREIGN KEY (cliente_id) REFERENCES clientes (id),
            UNIQUE(numero_factura, empresa_id)
        )
    `,
    detalles_factura: `
        CREATE TABLE IF NOT EXISTS detalles_factura (
            id SERIAL PRIMARY KEY,
            factura_id INTEGER,
            producto_id INTEGER,
            cantidad INTEGER NOT NULL,
            precio_unitario NUMERIC NOT NULL,
            subtotal NUMERIC NOT NULL,
            igic NUMERIC NOT NULL,
            total NUMERIC NOT NULL,
            descripcion TEXT,
            tipo_impuesto TEXT DEFAULT 'igic',
            FOREIGN KEY (factura_id) REFERENCES facturas (id),
            FOREIGN KEY (producto_id) REFERENCES productos (id)
        )
    `,
    audit_log: `
        CREATE TABLE IF NOT EXISTS audit_log (
            id SERIAL PRIMARY KEY,
            tabla TEXT NOT NULL,
            registro_id INTEGER NOT NULL,
            operacion TEXT NOT NULL,
            datos_anteriores TEXT,
            datos_nuevos TEXT,
            usuario_id INTEGER,
            fecha_operacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT
        )
    `,
    sellados_temporales: `
        CREATE TABLE IF NOT EXISTS sellados_temporales (
            id SERIAL PRIMARY KEY,
            documento_id INTEGER NOT NULL,
            tipo_documento TEXT NOT NULL DEFAULT 'factura',
            timestamp TIMESTAMP NOT NULL,
            hash_sellado TEXT NOT NULL,
            hash_documento TEXT NOT NULL,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (documento_id) REFERENCES facturas (id)
        )
    `
};

async function migrar() {
    let sqliteDb = null;
    let pgPool = null;
    
    try {
        log('\n🚀 Iniciando migración de SQLite a PostgreSQL...', 'cyan');
        log('═══════════════════════════════════════════════════════', 'cyan');
        
        // 1. Conectar a SQLite
        log('\n📂 Conectando a SQLite...', 'yellow');
        if (!fs.existsSync(sqlitePath)) {
            log(`⚠️  No se encontró el archivo SQLite en: ${sqlitePath}`, 'yellow');
            log('   Intentando buscar en otras ubicaciones...', 'yellow');
            
            // Intentar otras ubicaciones comunes
            const posiblesRutas = [
                './telwagen.db',
                './database/telwagen.db',
                '../database/telwagen.db',
                path.join(__dirname, 'telwagen.db'),
                path.join(__dirname, 'database', 'telwagen.db')
            ];
            
            let encontrado = false;
            for (const ruta of posiblesRutas) {
                if (fs.existsSync(ruta)) {
                    log(`   ✅ Encontrado en: ${ruta}`, 'green');
                    sqlitePath = ruta;
                    encontrado = true;
                    break;
                }
            }
            
            if (!encontrado) {
                log('\n❌ No se encontró el archivo SQLite en ninguna ubicación.', 'red');
                log('   El script creará las tablas en PostgreSQL pero no migrará datos.', 'yellow');
                log('   Si tienes datos en SQLite, asegúrate de que el archivo existe.', 'yellow');
                log('\n   ¿Deseas continuar creando solo las tablas? (S/N)', 'cyan');
                // Continuar de todas formas para crear las tablas
            }
        } else {
            log(`   ✅ Archivo SQLite encontrado: ${sqlitePath}`, 'green');
        }
        
        let tieneDatosSQLite = false;
        if (fs.existsSync(sqlitePath)) {
            sqliteDb = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    log(`⚠️  Error conectando a SQLite: ${err.message}`, 'yellow');
                    log('   Continuando solo con creación de tablas en PostgreSQL...', 'yellow');
                } else {
                    log('✅ Conectado a SQLite', 'green');
                    tieneDatosSQLite = true;
                }
            });
        } else {
            log('⚠️  No hay archivo SQLite, solo se crearán las tablas en PostgreSQL', 'yellow');
        }
        
        // 2. Conectar a PostgreSQL
        log('\n🐘 Conectando a PostgreSQL...', 'yellow');
        log(`   Host: ${pgConfig.host}:${pgConfig.port}`, 'cyan');
        log(`   Database: ${pgConfig.database}`, 'cyan');
        log(`   User: ${pgConfig.user}`, 'cyan');
        
        pgPool = new Pool(pgConfig);
        
        // Probar conexión
        await pgPool.query('SELECT NOW()');
        log('✅ Conectado a PostgreSQL', 'green');
        
        // 3. Crear tablas en PostgreSQL
        log('\n📋 Creando tablas en PostgreSQL...', 'yellow');
        for (const tabla of tablas) {
            if (esquemas[tabla]) {
                try {
                    await pgPool.query(esquemas[tabla]);
                    log(`   ✅ Tabla '${tabla}' creada/verificada`, 'green');
                } catch (err) {
                    if (err.message.includes('already exists')) {
                        log(`   ⚠️  Tabla '${tabla}' ya existe`, 'yellow');
                    } else {
                        throw err;
                    }
                }
            }
        }
        
        // 4. Migrar datos
        log('\n📦 Migrando datos...', 'yellow');
        let totalRegistros = 0;
        
        for (const tabla of tablas) {
            try {
                // Obtener datos de SQLite (solo si hay conexión)
                let rows = [];
                if (tieneDatosSQLite && sqliteDb) {
                    rows = await new Promise((resolve, reject) => {
                        sqliteDb.all(`SELECT * FROM ${tabla}`, (err, rows) => {
                            if (err) {
                                // Si la tabla no existe, continuar
                                if (err.message.includes('no such table')) {
                                    resolve([]);
                                } else {
                                    reject(err);
                                }
                            } else {
                                resolve(rows || []);
                            }
                        });
                    });
                }
                
                if (rows.length === 0) {
                    log(`   ⚠️  Tabla '${tabla}' está vacía o no existe`, 'yellow');
                    continue;
                }
                
                log(`\n   📊 Migrando tabla '${tabla}' (${rows.length} registros)...`, 'cyan');
                
                // Obtener nombres de columnas de la primera fila
                const columnas = Object.keys(rows[0]);
                
                // Obtener columnas que existen en PostgreSQL
                let columnasPostgres = columnas;
                try {
                    const pgColumns = await pgPool.query(`
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = $1
                        ORDER BY ordinal_position
                    `, [tabla]);
                    columnasPostgres = pgColumns.rows.map(r => r.column_name);
                } catch (err) {
                    // Si falla, usar las columnas de SQLite
                    log(`      ⚠️  No se pudieron obtener columnas de PostgreSQL, usando SQLite`, 'yellow');
                }
                
                // Filtrar columnas que existen en ambas bases de datos
                const columnasComunes = columnas.filter(col => columnasPostgres.includes(col));
                
                if (columnasComunes.length === 0) {
                    log(`      ⚠️  No hay columnas comunes, omitiendo tabla`, 'yellow');
                    continue;
                }
                
                const columnasStr = columnasComunes.join(', ');
                const placeholders = columnasComunes.map((_, i) => `$${i + 1}`).join(', ');
                
                // Determinar claves únicas para ON CONFLICT
                let conflictClause = '';
                if (tabla === 'empresas') {
                    conflictClause = 'ON CONFLICT (cif) DO NOTHING';
                } else if (tabla === 'clientes') {
                    conflictClause = 'ON CONFLICT (identificacion) DO NOTHING';
                } else if (tabla === 'coches') {
                    conflictClause = 'ON CONFLICT (matricula) DO NOTHING';
                } else if (tabla === 'usuarios') {
                    conflictClause = 'ON CONFLICT (username) DO NOTHING';
                } else if (tabla === 'facturas') {
                    conflictClause = 'ON CONFLICT (numero_factura, empresa_id) DO NOTHING';
                } else {
                    conflictClause = 'ON CONFLICT (id) DO NOTHING';
                }
                
                // Insertar datos
                let insertados = 0;
                let errores = 0;
                let duplicados = 0;
                
                // Insertar en lotes para mejor rendimiento
                const batchSize = 100;
                for (let i = 0; i < rows.length; i += batchSize) {
                    const batch = rows.slice(i, i + batchSize);
                    
                    for (const row of batch) {
                        try {
                            const valores = columnasComunes.map(col => {
                                let valor = row[col];
                                
                                // Convertir booleanos de SQLite (0/1) a PostgreSQL
                                if (typeof valor === 'number' && (col === 'activo' || col.includes('activo'))) {
                                    valor = valor === 1 ? true : false;
                                }
                                
                                // Convertir DATETIME a formato correcto
                                if (valor && typeof valor === 'string' && col.includes('fecha') || col.includes('timestamp')) {
                                    // Ya debería estar en formato correcto
                                }
                                
                                // Manejar NULL
                                if (valor === null || valor === undefined || valor === '') {
                                    return null;
                                }
                                
                                return valor;
                            });
                            
                            const query = `INSERT INTO ${tabla} (${columnasStr}) VALUES (${placeholders}) ${conflictClause}`;
                            const result = await pgPool.query(query, valores);
                            
                            if (result.rowCount > 0) {
                                insertados++;
                            } else {
                                duplicados++;
                            }
                        } catch (err) {
                            if (err.message.includes('duplicate key') || 
                                err.message.includes('UNIQUE') ||
                                err.message.includes('violates unique constraint')) {
                                duplicados++;
                            } else {
                                errores++;
                                if (errores <= 5) { // Mostrar solo los primeros 5 errores
                                    log(`      ❌ Error insertando registro: ${err.message.substring(0, 100)}`, 'red');
                                }
                            }
                        }
                    }
                    
                    // Mostrar progreso
                    if ((i + batchSize) % 500 === 0 || i + batchSize >= rows.length) {
                        process.stdout.write(`\r      Progreso: ${Math.min(i + batchSize, rows.length)}/${rows.length} registros procesados...`);
                    }
                }
                
                process.stdout.write('\n'); // Nueva línea después del progreso
                
                log(`      ✅ ${insertados} registros insertados`, 'green');
                if (duplicados > 0) {
                    log(`      ℹ️  ${duplicados} registros duplicados (ya existían)`, 'cyan');
                }
                if (errores > 0) {
                    log(`      ⚠️  ${errores} errores durante la inserción`, 'yellow');
                }
                
                totalRegistros += insertados;
                
            } catch (err) {
                if (err.message.includes('no such table')) {
                    log(`   ⚠️  Tabla '${tabla}' no existe en SQLite, omitiendo...`, 'yellow');
                } else {
                    log(`   ❌ Error migrando tabla '${tabla}': ${err.message}`, 'red');
                    throw err;
                }
            }
        }
        
        // 5. Crear índices
        log('\n📇 Creando índices...', 'yellow');
        const indices = [
            { tabla: 'facturas', columna: 'empresa_id', nombre: 'idx_facturas_empresa' },
            { tabla: 'facturas', columna: 'cliente_id', nombre: 'idx_facturas_cliente' },
            { tabla: 'facturas', columna: 'fecha_emision', nombre: 'idx_facturas_fecha' },
            { tabla: 'detalles_factura', columna: 'factura_id', nombre: 'idx_detalles_factura' },
            { tabla: 'detalles_factura', columna: 'producto_id', nombre: 'idx_detalles_producto' },
            { tabla: 'sellados_temporales', columna: 'documento_id', nombre: 'idx_sellados_documento' },
            { tabla: 'sellados_temporales', columna: 'timestamp', nombre: 'idx_sellados_timestamp' },
            { tabla: 'audit_log', columna: 'tabla', nombre: 'idx_audit_tabla' },
            { tabla: 'audit_log', columna: 'fecha_operacion', nombre: 'idx_audit_fecha' }
        ];
        
        for (const indice of indices) {
            try {
                await pgPool.query(`
                    CREATE INDEX IF NOT EXISTS ${indice.nombre} 
                    ON ${indice.tabla} (${indice.columna})
                `);
                log(`   ✅ Índice '${indice.nombre}' creado`, 'green');
            } catch (err) {
                if (!err.message.includes('already exists')) {
                    log(`   ⚠️  Error creando índice '${indice.nombre}': ${err.message}`, 'yellow');
                }
            }
        }
        
        // 6. Verificar migración
        log('\n🔍 Verificando migración...', 'yellow');
        let totalPostgres = 0;
        for (const tabla of tablas) {
            try {
                const result = await pgPool.query(`SELECT COUNT(*) as count FROM ${tabla}`);
                const count = parseInt(result.rows[0].count);
                totalPostgres += count;
                log(`   ${tabla}: ${count} registros`, 'cyan');
            } catch (err) {
                if (!err.message.includes('does not exist')) {
                    log(`   ⚠️  Error verificando '${tabla}': ${err.message}`, 'yellow');
                }
            }
        }
        
        // 7. Resumen
        log('\n═══════════════════════════════════════════════════════', 'cyan');
        log(`✅ Migración completada exitosamente!`, 'green');
        log(`   Total de registros procesados: ${totalRegistros}`, 'green');
        log(`   Total de registros en PostgreSQL: ${totalPostgres}`, 'green');
        log('═══════════════════════════════════════════════════════\n', 'cyan');
        
        log('📝 Próximos pasos:', 'yellow');
        log('   1. Configura DB_TYPE=postgresql en tu archivo .env', 'cyan');
        log('   2. Reinicia el servidor: npm start', 'cyan');
        log('   3. Verifica que todo funcione correctamente\n', 'cyan');
        
    } catch (error) {
        log('\n❌ Error durante la migración:', 'red');
        log(`   ${error.message}`, 'red');
        if (error.stack) {
            log(`\n   Stack trace:\n   ${error.stack}`, 'red');
        }
        process.exit(1);
    } finally {
        // Cerrar conexiones
        if (sqliteDb) {
            sqliteDb.close((err) => {
                if (err) {
                    log(`Error cerrando SQLite: ${err.message}`, 'red');
                }
            });
        }
        if (pgPool) {
            await pgPool.end();
            log('\n🔌 Conexiones cerradas', 'cyan');
        }
    }
}

// Ejecutar migración
if (require.main === module) {
    migrar().catch(err => {
        console.error('Error fatal:', err);
        process.exit(1);
    });
}

module.exports = { migrar };


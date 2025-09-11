const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Módulos para cumplir con la Ley Antifraude
const SistemaIntegridad = require('./modules/sistemaIntegridad');
const SistemaAuditoria = require('./modules/sistemaAuditoria');
const GeneradorVeriFactu = require('./modules/generadorVeriFactu');
const SistemaBackup = require('./modules/sistemaBackup');
const SistemaCifrado = require('./modules/sistemaCifrado');
const SistemaControlAcceso = require('./modules/sistemaControlAcceso');
const SistemaLogsSeguridad = require('./modules/sistemaLogsSeguridad');
const SistemaValidacionFiscal = require('./modules/sistemaValidacionFiscal');
const SistemaFirmaDigital = require('./modules/sistemaFirmaDigital');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Inicializar base de datos
const dbPath = path.join(__dirname, 'database', 'telwagen.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error al conectar con la base de datos:', err.message);
    } else {
        console.log('✅ Base de datos conectada exitosamente');
        initDatabase();
    }
});

// Inicializar módulos de la Ley Antifraude
let sistemaIntegridad, sistemaAuditoria, generadorVeriFactu, sistemaBackup;
let sistemaCifrado, sistemaControlAcceso, sistemaLogsSeguridad, sistemaValidacionFiscal;
let sistemaFirmaDigital;

// Función para inicializar módulos después de la base de datos
function initModulosAntifraude() {
    try {
        sistemaIntegridad = new SistemaIntegridad();
        sistemaAuditoria = new SistemaAuditoria(db);
        generadorVeriFactu = new GeneradorVeriFactu();
        sistemaBackup = new SistemaBackup(db, {
            directorioBackup: './backups',
            frecuenciaBackup: 24 * 60 * 60 * 1000, // 24 horas
            retencionDias: 1460 // 4 años
        });
        
        // Nuevos módulos de seguridad
        sistemaCifrado = new SistemaCifrado();
        sistemaControlAcceso = new SistemaControlAcceso(db);
        sistemaLogsSeguridad = new SistemaLogsSeguridad(db);
        sistemaValidacionFiscal = new SistemaValidacionFiscal();
        sistemaFirmaDigital = new SistemaFirmaDigital();
        
        // Inicializar sistemas que requieren base de datos
        sistemaControlAcceso.inicializar();
        sistemaLogsSeguridad.inicializar();
        
        // Iniciar backup automático
        sistemaBackup.iniciarBackupAutomatico();
        
        console.log('✅ Módulos de Ley Antifraude inicializados correctamente');
        console.log('🔒 Sistema de cifrado activado');
        console.log('🛡️ Sistema de control de acceso activado');
        console.log('📋 Sistema de logs de seguridad activado');
        console.log('✅ Sistema de validación fiscal activado');
        console.log('🔐 Sistema de firma digital activado');
        console.log('💾 Sistema de backup automático activado');
        
        // Configurar endpoints de seguridad después de la inicialización
        configurarEndpointsSeguridad();
    } catch (error) {
        console.error('❌ Error al inicializar módulos de Ley Antifraude:', error);
    }
}

// Inicializar tablas
function initDatabase() {
    console.log('🔧 Inicializando base de datos...');
    
    // Crear tablas secuencialmente
    db.serialize(() => {
        // Tabla de clientes
        db.run(`
            CREATE TABLE IF NOT EXISTS clientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                direccion TEXT NOT NULL,
                codigo_postal TEXT,
                identificacion TEXT UNIQUE NOT NULL,
                email TEXT,
                telefono TEXT,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('❌ Error al crear tabla clientes:', err.message);
            } else {
                console.log('✅ Tabla clientes creada/verificada');
                // Añadir columna codigo_postal si no existe
                db.run('ALTER TABLE clientes ADD COLUMN codigo_postal TEXT', (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        console.error('❌ Error al añadir columna codigo_postal:', err.message);
                    } else {
                        console.log('✅ Columna codigo_postal verificada/añadida');
                    }
                });
            }
        });

        // Tabla de empresas
        db.run(`
            CREATE TABLE IF NOT EXISTS empresas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                cif TEXT UNIQUE NOT NULL,
                direccion TEXT NOT NULL,
                telefono TEXT,
                email TEXT,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('❌ Error al crear tabla empresas:', err.message);
            } else {
                console.log('✅ Tabla empresas creada/verificada');
            }
        });

        // Tabla de coches
        db.run(`
            CREATE TABLE IF NOT EXISTS coches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                matricula TEXT UNIQUE NOT NULL,
                chasis TEXT NOT NULL,
                color TEXT NOT NULL,
                kms INTEGER NOT NULL,
                modelo TEXT NOT NULL,
                activo BOOLEAN DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('❌ Error al crear tabla coches:', err.message);
            } else {
                console.log('✅ Tabla coches creada/verificada');
            }
        });

        // Tabla de productos/vehículos
        db.run(`
            CREATE TABLE IF NOT EXISTS productos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo TEXT UNIQUE NOT NULL,
                descripcion TEXT NOT NULL,
                precio REAL NOT NULL,
                stock INTEGER DEFAULT 0,
                categoria TEXT DEFAULT 'vehiculo',
                activo BOOLEAN DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('❌ Error al crear tabla productos:', err.message);
            } else {
                console.log('✅ Tabla productos creada/verificada');
            }
        });

        // Tabla de facturas
        db.run(`
            CREATE TABLE IF NOT EXISTS facturas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero_factura TEXT NOT NULL,
                empresa_id INTEGER NOT NULL,
                cliente_id INTEGER,
                fecha_emision DATE NOT NULL,
                fecha_vencimiento DATE,
                subtotal REAL NOT NULL,
                igic REAL NOT NULL,
                total REAL NOT NULL,
                estado TEXT DEFAULT 'pendiente',
                notas TEXT,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (empresa_id) REFERENCES empresas (id),
                FOREIGN KEY (cliente_id) REFERENCES clientes (id),
                UNIQUE(numero_factura, empresa_id)
            )
        `, (err) => {
            if (err) {
                console.error('❌ Error al crear tabla facturas:', err.message);
            } else {
                console.log('✅ Tabla facturas creada/verificada');
            }
        });

        // Tabla de detalles de factura
        db.run(`
            CREATE TABLE IF NOT EXISTS detalles_factura (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                factura_id INTEGER,
                producto_id INTEGER,
                cantidad INTEGER NOT NULL,
                precio_unitario REAL NOT NULL,
                subtotal REAL NOT NULL,
                igic REAL NOT NULL,
                total REAL NOT NULL,
                descripcion TEXT,
                tipo_impuesto TEXT DEFAULT 'igic',
                FOREIGN KEY (factura_id) REFERENCES facturas (id),
                FOREIGN KEY (producto_id) REFERENCES productos (id)
            )
        `, (err) => {
            if (err) {
                console.error('❌ Error al crear tabla detalles_factura:', err.message);
            } else {
                console.log('✅ Tabla detalles_factura creada/verificada');
                
                // Agregar columna descripcion si no existe (migración)
                db.run(`ALTER TABLE detalles_factura ADD COLUMN descripcion TEXT`, (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        console.error('❌ Error al agregar columna descripcion:', err.message);
                    } else if (!err) {
                        console.log('✅ Columna descripcion agregada a detalles_factura');
                    }
                });
                
                // Agregar columna tipo_impuesto si no existe (migración)
                db.run(`ALTER TABLE detalles_factura ADD COLUMN tipo_impuesto TEXT DEFAULT 'igic'`, (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        console.error('❌ Error al agregar columna tipo_impuesto:', err.message);
                    } else if (!err) {
                        console.log('✅ Columna tipo_impuesto agregada a detalles_factura');
                    }
                });
                
                // Insertar datos de ejemplo después de crear todas las tablas
                insertSampleData();
                
                // Inicializar módulos de Ley Antifraude
                initModulosAntifraude();
            }
        });
    });
}

// Insertar datos de ejemplo
function insertSampleData() {
    // Insertar empresa Telwagen
    db.run(`
        INSERT OR IGNORE INTO empresas (nombre, cif, direccion, telefono, email)
        VALUES (?, ?, ?, ?, ?)
    `, [
        'Telwagen Car Ibérica, S.L.',
        'B-93.289.585',
        'C. / Tomás Miller N° 48 Local\n35007 Las Palmas de Gran Canaria',
        '+34 928 123 456',
        'info@telwagen.es'
    ], (err) => {
        if (err) {
            console.error('❌ Error al insertar empresa:', err.message);
        } else {
            console.log('✅ Empresa Telwagen insertada/verificada');
        }
    });

    // Insertar clientes de ejemplo
    const clientesEjemplo = [
        {
            nombre: 'GRUPO MIGUEL LEON S.L.',
            direccion: 'C/. ALFREDO MARTIN REYES N° 7\nLAS PALMAS DE G.C.',
            identificacion: 'B76233865',
            email: 'info@grupomiguelleon.es',
            telefono: '+34 928 123 456'
        }
    ];

    clientesEjemplo.forEach(cliente => {
        db.run(`
            INSERT OR IGNORE INTO clientes (nombre, direccion, identificacion, email, telefono)
            VALUES (?, ?, ?, ?, ?)
        `, [cliente.nombre, cliente.direccion, cliente.identificacion, cliente.email, cliente.telefono], (err) => {
            if (err) {
                console.error('❌ Error al insertar cliente:', err.message);
            } else {
                console.log('✅ Cliente insertado/verificado:', cliente.nombre);
            }
        });
    });

    // Coches de ejemplo
    const cochesEjemplo = [
        {
            matricula: 'GC-1234-AB',
            chasis: 'WBAVB13506PT12345',
            color: 'Blanco',
            kms: 45000,
            modelo: 'BMW 320i'
        },
        {
            matricula: 'GC-5678-CD',
            chasis: 'WVWZZZ1KZAW123456',
            color: 'Negro',
            kms: 32000,
            modelo: 'Volkswagen Golf'
        },
        {
            matricula: 'GC-9012-EF',
            chasis: 'WDDNG7JB0FA123456',
            color: 'Azul',
            kms: 28000,
            modelo: 'Mercedes-Benz Clase A'
        },
        {
            matricula: 'GC-3456-GH',
            chasis: 'WBAVB13506PT12346',
            color: 'Gris',
            kms: 52000,
            modelo: 'BMW 320i'
        },
        {
            matricula: 'GC-7890-IJ',
            chasis: 'WVWZZZ1KZAW123457',
            color: 'Rojo',
            kms: 38000,
            modelo: 'Volkswagen Golf'
        },
        {
            matricula: 'GC-2345-KL',
            chasis: 'WDDNG7JB0FA123457',
            color: 'Verde',
            kms: 15000,
            modelo: 'Mercedes-Benz Clase A'
        },
        {
            matricula: 'GC-6789-MN',
            chasis: 'WBAVB13506PT12348',
            color: 'Negro',
            kms: 67000,
            modelo: 'BMW 320i'
        },
        {
            matricula: 'GC-0123-OP',
            chasis: 'WVWZZZ1KZAW123458',
            color: 'Blanco',
            kms: 42000,
            modelo: 'Volkswagen Golf'
        },
        {
            matricula: 'GC-4567-QR',
            chasis: 'WDDNG7JB0FA123458',
            color: 'Azul',
            kms: 33000,
            modelo: 'Mercedes-Benz Clase A'
        },
        {
            matricula: 'GC-8901-ST',
            chasis: 'WBAVB13506PT12349',
            color: 'Gris',
            kms: 28000,
            modelo: 'BMW 320i'
        },
        {
            matricula: 'GC-2345-UV',
            chasis: 'WVWZZZ1KZAW123459',
            color: 'Rojo',
            kms: 55000,
            modelo: 'Volkswagen Golf'
        },
        {
            matricula: 'GC-6789-WX',
            chasis: 'WDDNG7JB0FA123459',
            color: 'Negro',
            kms: 19000,
            modelo: 'Mercedes-Benz Clase A'
        },
        {
            matricula: 'GC-0123-YZ',
            chasis: 'WBAVB13506PT12350',
            color: 'Blanco',
            kms: 41000,
            modelo: 'BMW 320i'
        },
        {
            matricula: 'GC-4567-AA',
            chasis: 'WVWZZZ1KZAW123460',
            color: 'Verde',
            kms: 36000,
            modelo: 'Volkswagen Golf'
        },
        {
            matricula: 'GC-8901-BB',
            chasis: 'WDDNG7JB0FA123460',
            color: 'Gris',
            kms: 24000,
            modelo: 'Mercedes-Benz Clase A'
        },
        {
            matricula: 'GC-2345-CC',
            chasis: 'WBAVB13506PT12351',
            color: 'Azul',
            kms: 48000,
            modelo: 'BMW 320i'
        },
        {
            matricula: 'GC-6789-DD',
            chasis: 'WVWZZZ1KZAW123461',
            color: 'Negro',
            kms: 29000,
            modelo: 'Volkswagen Golf'
        },
        {
            matricula: 'GC-0123-EE',
            chasis: 'WDDNG7JB0FA123461',
            color: 'Blanco',
            kms: 17000,
            modelo: 'Mercedes-Benz Clase A'
        },
        {
            matricula: 'GC-4567-FF',
            chasis: 'WBAVB13506PT12352',
            color: 'Rojo',
            kms: 39000,
            modelo: 'BMW 320i'
        },
        {
            matricula: 'GC-8901-GG',
            chasis: 'WVWZZZ1KZAW123462',
            color: 'Gris',
            kms: 44000,
            modelo: 'Volkswagen Golf'
        },
        {
            matricula: 'GC-2345-HH',
            chasis: 'WDDNG7JB0FA123462',
            color: 'Negro',
            kms: 22000,
            modelo: 'Mercedes-Benz Clase A'
        },
        {
            matricula: 'GC-6789-II',
            chasis: 'WBAVB13506PT12353',
            color: 'Azul',
            kms: 51000,
            modelo: 'BMW 320i'
        },
        {
            matricula: 'GC-0123-JJ',
            chasis: 'WVWZZZ1KZAW123463',
            color: 'Blanco',
            kms: 31000,
            modelo: 'Volkswagen Golf'
        }
    ];

    cochesEjemplo.forEach(coche => {
        db.run(`
            INSERT OR IGNORE INTO coches (matricula, chasis, color, kms, modelo)
            VALUES (?, ?, ?, ?, ?)
        `, [coche.matricula, coche.chasis, coche.color, coche.kms, coche.modelo], (err) => {
            if (err) {
                console.error('❌ Error al insertar coche:', err.message);
            } else {
                console.log('✅ Coche insertado/verificado:', coche.matricula);
            }
        });
    });

    // Productos de ejemplo
    const productosEjemplo = [
        { codigo: 'NISSAN-MICRA-1.0', descripcion: 'NISSAN MICRA 1.0 IGT ACENTA 92-100 CV', precio: 9589.04 },
        { codigo: 'NISSAN-QASHQAI-1.3', descripcion: 'NISSAN QASHQAI 1.3 DIG-T ACENTA 140 CV', precio: 18950.00 },
        { codigo: 'NISSAN-LEAF-40KWH', descripcion: 'NISSAN LEAF 40 kWh ACENTA', precio: 28990.00 },
        { codigo: 'NISSAN-JUKE-1.0', descripcion: 'NISSAN JUKE 1.0 DIG-T ACENTA 117 CV', precio: 15990.00 }
    ];

    productosEjemplo.forEach(producto => {
        db.run(`
            INSERT OR IGNORE INTO productos (codigo, descripcion, precio, stock)
            VALUES (?, ?, ?, ?)
        `, [producto.codigo, producto.descripcion, producto.precio, 10]);
    });

    console.log('✅ Datos de ejemplo insertados');
}

// Rutas API

// GET - Obtener todas las empresas
app.get('/api/empresas', (req, res) => {
    db.all('SELECT * FROM empresas ORDER BY nombre', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// GET - Obtener empresa por ID
app.get('/api/empresas/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM empresas WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Empresa no encontrada' });
            return;
        }
        res.json({ success: true, data: row });
    });
});

// POST - Crear nueva empresa
app.post('/api/empresas', (req, res) => {
    const { nombre, cif, direccion, telefono, email } = req.body;
    
    db.run(`
        INSERT INTO empresas (nombre, cif, direccion, telefono, email)
        VALUES (?, ?, ?, ?, ?)
    `, [nombre, cif, direccion, telefono, email], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            success: true, 
            data: { 
                id: this.lastID, 
                nombre, 
                cif, 
                direccion, 
                telefono, 
                email
            } 
        });
    });
});

// PUT - Actualizar empresa
app.put('/api/empresas/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, cif, direccion, telefono, email } = req.body;
    
    db.run(`
        UPDATE empresas 
        SET nombre = ?, cif = ?, direccion = ?, telefono = ?, email = ?
        WHERE id = ?
    `, [nombre, cif, direccion, telefono, email, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Empresa no encontrada' });
            return;
        }
        res.json({ success: true, message: 'Empresa actualizada correctamente' });
    });
});

// DELETE - Eliminar empresa (eliminación física)
app.delete('/api/empresas/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM empresas WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Empresa no encontrada' });
            return;
        }
        res.json({ success: true, message: 'Empresa eliminada correctamente' });
    });
});

// POST - Limpiar y recrear datos de ejemplo
app.post('/api/reset-data', (req, res) => {
    console.log('🔄 Limpiando y recreando datos de ejemplo...');
    
    db.serialize(() => {
        // Limpiar tablas
        db.run('DELETE FROM empresas', (err) => {
            if (err) {
                console.error('❌ Error al limpiar empresas:', err.message);
            } else {
                console.log('✅ Tabla empresas limpiada');
            }
        });
        
        db.run('DELETE FROM productos', (err) => {
            if (err) {
                console.error('❌ Error al limpiar productos:', err.message);
            } else {
                console.log('✅ Tabla productos limpiada');
            }
        });
        
        db.run('DELETE FROM clientes', (err) => {
            if (err) {
                console.error('❌ Error al limpiar clientes:', err.message);
            } else {
                console.log('✅ Tabla clientes limpiada');
            }
        });
        
        db.run('DELETE FROM coches', (err) => {
            if (err) {
                console.error('❌ Error al limpiar coches:', err.message);
            } else {
                console.log('✅ Tabla coches limpiada');
            }
        });
        
        db.run('DELETE FROM facturas', (err) => {
            if (err) {
                console.error('❌ Error al limpiar facturas:', err.message);
            } else {
                console.log('✅ Tabla facturas limpiada');
            }
        });
        
        db.run('DELETE FROM detalles_factura', (err) => {
            if (err) {
                console.error('❌ Error al limpiar detalles_factura:', err.message);
            } else {
                console.log('✅ Tabla detalles_factura limpiada');
            }
        });
        
        // Recrear datos de ejemplo
        setTimeout(() => {
            insertSampleData();
            res.json({ success: true, message: 'Datos de ejemplo recreados correctamente' });
        }, 1000);
    });
});

// GET - Obtener todos los clientes
app.get('/api/clientes', (req, res) => {
    db.all('SELECT * FROM clientes ORDER BY fecha_creacion DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// POST - Crear nuevo cliente
app.post('/api/clientes', (req, res) => {
    const { nombre, direccion, codigo_postal, identificacion, email, telefono } = req.body;
    
    db.run(`
        INSERT INTO clientes (nombre, direccion, codigo_postal, identificacion, email, telefono)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [nombre, direccion, codigo_postal, identificacion, email, telefono], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            success: true, 
            data: { 
                id: this.lastID, 
                nombre, 
                direccion, 
                codigo_postal,
                identificacion, 
                email, 
                telefono 
            } 
        });
    });
});

// GET - Obtener cliente por ID
app.get('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM clientes WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Cliente no encontrado' });
            return;
        }
        res.json({ success: true, data: row });
    });
});

// PUT - Actualizar cliente
app.put('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, direccion, codigo_postal, identificacion, email, telefono } = req.body;
    
    db.run(`
        UPDATE clientes 
        SET nombre = ?, direccion = ?, codigo_postal = ?, identificacion = ?, email = ?, telefono = ?
        WHERE id = ?
    `, [nombre, direccion, codigo_postal, identificacion, email, telefono, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Cliente no encontrado' });
            return;
        }
        res.json({ success: true, message: 'Cliente actualizado correctamente' });
    });
});

// DELETE - Desactivar cliente (soft delete)
app.delete('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    
    // Como la tabla clientes no tiene campo activo, eliminamos físicamente
    db.run('DELETE FROM clientes WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Cliente no encontrado' });
            return;
        }
        res.json({ success: true, message: 'Cliente eliminado correctamente' });
    });
});

// GET - Obtener todos los coches
app.get('/api/coches', (req, res) => {
    db.all('SELECT * FROM coches WHERE activo = 1 ORDER BY fecha_creacion DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// GET - Obtener coches disponibles para productos (con información de productos asociados)
app.get('/api/coches/disponibles', (req, res) => {
    db.all(`
        SELECT c.*, 
               CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END as tiene_producto,
               p.precio as precio_producto,
               p.codigo as codigo_producto
        FROM coches c
        LEFT JOIN productos p ON c.matricula = p.codigo
        WHERE c.activo = 1 
        ORDER BY c.fecha_creacion DESC
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// GET - Obtener coche por ID
app.get('/api/coches/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM coches WHERE id = ? AND activo = 1', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Coche no encontrado' });
            return;
        }
        res.json({ success: true, data: row });
    });
});

// POST - Crear nuevo coche
app.post('/api/coches', (req, res) => {
    const { matricula, chasis, color, kms, modelo } = req.body;
    
    db.run(`
        INSERT INTO coches (matricula, chasis, color, kms, modelo)
        VALUES (?, ?, ?, ?, ?)
    `, [matricula, chasis, color, kms, modelo], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            success: true, 
            data: { 
                id: this.lastID, 
                matricula, 
                chasis, 
                color, 
                kms, 
                modelo 
            } 
        });
    });
});

// PUT - Actualizar coche
app.put('/api/coches/:id', (req, res) => {
    const { id } = req.params;
    const { matricula, chasis, color, kms, modelo } = req.body;
    
    db.run(`
        UPDATE coches 
        SET matricula = ?, chasis = ?, color = ?, kms = ?, modelo = ?
        WHERE id = ? AND activo = 1
    `, [matricula, chasis, color, kms, modelo, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Coche no encontrado' });
            return;
        }
        res.json({ success: true, message: 'Coche actualizado correctamente' });
    });
});

// DELETE - Desactivar coche (soft delete)
app.delete('/api/coches/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('UPDATE coches SET activo = 0 WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Coche no encontrado' });
            return;
        }
        res.json({ success: true, message: 'Coche desactivado correctamente' });
    });
});

// GET - Obtener todos los productos
app.get('/api/productos', (req, res) => {
    db.all('SELECT * FROM productos WHERE activo = 1 ORDER BY descripcion', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// POST - Crear nuevo producto
app.post('/api/productos', (req, res) => {
    const { codigo, descripcion, precio, stock, categoria } = req.body;
    
    db.run(`
        INSERT INTO productos (codigo, descripcion, precio, stock, categoria)
        VALUES (?, ?, ?, ?, ?)
    `, [codigo, descripcion, precio, stock, categoria], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            success: true, 
            data: { 
                id: this.lastID, 
                codigo, 
                descripcion, 
                precio, 
                stock, 
                categoria 
            } 
        });
    });
});

// POST - Crear producto desde coche
app.post('/api/productos/desde-coche', (req, res) => {
    const { coche_id, precio, cantidad = 1 } = req.body;
    
    // Primero obtener los datos del coche
    db.get('SELECT * FROM coches WHERE id = ? AND activo = 1', [coche_id], (err, coche) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!coche) {
            res.status(404).json({ error: 'Coche no encontrado' });
            return;
        }
        
        // Generar código único basado en la matrícula
        const codigo = `COCHE-${coche.matricula.replace(/[^A-Z0-9]/g, '')}`;
        
        // Generar descripción automática
        const descripcion = `${coche.modelo} - ${coche.color} - ${coche.kms.toLocaleString()} km - Chasis: ${coche.chasis}`;
        
        // Crear el producto
        db.run(`
            INSERT INTO productos (codigo, descripcion, precio, stock, categoria)
            VALUES (?, ?, ?, ?, ?)
        `, [codigo, descripcion, precio, cantidad, 'vehiculo'], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({ 
                success: true, 
                data: { 
                    id: this.lastID, 
                    codigo, 
                    descripcion, 
                    precio, 
                    stock: cantidad, 
                    categoria: 'vehiculo',
                    coche: coche
                } 
            });
        });
    });
});

// GET - Obtener todas las facturas
app.get('/api/facturas', (req, res) => {
    db.all(`
        SELECT f.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion,
               e.nombre as empresa_nombre, e.cif as empresa_cif, e.direccion as empresa_direccion
        FROM facturas f 
        LEFT JOIN clientes c ON f.cliente_id = c.id 
        LEFT JOIN empresas e ON f.empresa_id = e.id
        ORDER BY f.fecha_emision DESC, f.id DESC
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// POST - Crear nueva factura (Cumpliendo Ley Antifraude)
app.post('/api/facturas', async (req, res) => {
    try {
        const { 
            numero_factura, 
            empresa_id,
            cliente_id, 
            fecha_emision, 
            fecha_vencimiento, 
            subtotal, 
            igic, 
            total, 
            notas,
            productos,
            // Campos adicionales de Ley Antifraude
            fecha_operacion,
            tipo_documento = 'factura',
            metodo_pago = 'transferencia',
            referencia_operacion
        } = req.body;
        
        // Generar número de serie único
        const numero_serie = sistemaIntegridad.generarNumeroSerie(empresa_id, numero_factura);
        
        // Preparar datos para hash de integridad
        const datosFactura = {
            numero_factura,
            empresa_id,
            cliente_id,
            fecha_emision,
            fecha_operacion: fecha_operacion || fecha_emision,
            subtotal,
            igic,
            total,
            productos: productos || []
        };
        
        // Generar hash de integridad
        const hash_documento = sistemaIntegridad.generarHashIntegridad(datosFactura);
        
        // Generar sellado temporal
        const selladoTemporal = sistemaIntegridad.generarSelladoTemporal(datosFactura);
        
        // Insertar factura con todos los campos de Ley Antifraude
        const query = `
            INSERT INTO facturas (
                numero_factura, empresa_id, cliente_id, fecha_emision, fecha_vencimiento,
                subtotal, igic, total, notas, numero_serie, fecha_operacion,
                tipo_documento, metodo_pago, referencia_operacion, hash_documento,
                sellado_temporal, estado_fiscal
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            numero_factura, empresa_id, cliente_id, fecha_emision, fecha_vencimiento,
            subtotal, igic, total, notas, numero_serie, fecha_operacion || fecha_emision,
            tipo_documento, metodo_pago, referencia_operacion || '', hash_documento,
            selladoTemporal.timestamp, 'pendiente'
        ];
        
        db.run(query, params, async function(err) {
            if (err) {
                console.error('❌ Error al crear factura:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            
            const facturaId = this.lastID;
            
            try {
                // Insertar detalles de la factura
                if (productos && productos.length > 0) {
                    for (const producto of productos) {
                        const productoId = producto.id && producto.id > 0 ? producto.id : null;
                        
                        await new Promise((resolve, reject) => {
                            db.run(`
                                INSERT INTO detalles_factura (factura_id, producto_id, cantidad, precio_unitario, subtotal, igic, total, descripcion, tipo_impuesto)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `, [facturaId, productoId, producto.cantidad, producto.precioUnitario, producto.subtotal, producto.impuesto, producto.total, producto.descripcion || null, producto.tipoImpuesto || 'igic'], function(err) {
                                if (err) {
                                    console.error('❌ Error al insertar detalle de factura:', err.message);
                                    reject(err);
                                } else {
                                    console.log('✅ Detalle de factura insertado:', this.lastID);
                                    resolve();
                                }
                            });
                        });
                    }
                }
                
                // Registrar en auditoría
                const datosCompletosFactura = {
                    id: facturaId,
                    numero_factura,
                    numero_serie,
                    empresa_id,
                    cliente_id,
                    fecha_emision,
                    fecha_operacion: fecha_operacion || fecha_emision,
                    subtotal,
                    igic,
                    total,
                    hash_documento,
                    sellado_temporal: selladoTemporal.timestamp
                };
                
                await sistemaAuditoria.registrarCreacionFactura(datosCompletosFactura);
                
                // Generar código VeriFactu
                const codigoVeriFactu = sistemaIntegridad.generarCodigoVeriFactu(datosCompletosFactura);
                
                // Actualizar factura con código VeriFactu
                db.run('UPDATE facturas SET codigo_verifactu = ? WHERE id = ?', [codigoVeriFactu, facturaId]);
                
                // Generar firma digital de la factura
                const datosFacturaParaFirma = {
                    ...datosCompletosFactura,
                    codigo_verifactu: codigoVeriFactu,
                    productos: productos || []
                };
                
                const firmaDigital = sistemaFirmaDigital.firmarFactura(datosFacturaParaFirma);
                
                // Actualizar factura con información de firma digital
                db.run('UPDATE facturas SET respuesta_aeat = ? WHERE id = ?', 
                    [JSON.stringify({ firma_digital: firmaDigital.firma, archivo_firma: firmaDigital.archivo }), facturaId]);
                
                console.log('🔐 Factura firmada digitalmente:', firmaDigital.archivo);
                
                console.log('✅ Factura creada con cumplimiento de Ley Antifraude:', facturaId);
                
                res.json({ 
                    success: true, 
                    data: { 
                        id: facturaId, 
                        numero_factura,
                        numero_serie,
                        hash_documento,
                        sellado_temporal: selladoTemporal.timestamp,
                        codigo_verifactu: codigoVeriFactu,
                        total 
                    } 
                });
                
            } catch (error) {
                console.error('❌ Error en proceso de creación de factura:', error);
                res.status(500).json({ error: 'Error en el proceso de creación de factura' });
            }
        });
        
    } catch (error) {
        console.error('❌ Error general en creación de factura:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET - Generar siguiente número de factura por empresa
app.get('/api/facturas/siguiente-numero/:empresaId', (req, res) => {
    const empresaId = req.params.empresaId;
    const año = new Date().getFullYear();
    
    // Primero obtener los datos de la empresa
    db.get(`
        SELECT nombre, cif, direccion FROM empresas WHERE id = ?
    `, [empresaId], (err, empresa) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!empresa) {
            res.status(404).json({ error: 'Empresa no encontrada' });
            return;
        }
        
        // Generar prefijo basado en nombre y ubicación
        const prefijo = generarPrefijoEmpresa(empresa.nombre, empresa.direccion);
        
        // Buscar el último número de factura para esta empresa
        db.get(`
            SELECT MAX(CAST(SUBSTR(numero_factura, ${prefijo.length + 1}, 3) AS INTEGER)) as ultimo_numero
            FROM facturas 
            WHERE empresa_id = ? AND numero_factura LIKE '${prefijo}%/${año}'
        `, [empresaId], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const siguienteNumero = (row.ultimo_numero || 0) + 1;
            const numeroFormateado = `${prefijo}${siguienteNumero.toString().padStart(3, '0')}/${año}`;
            
            res.json({ 
                success: true, 
                data: { 
                    numero_factura: numeroFormateado,
                    empresa_id: empresaId,
                    prefijo: prefijo,
                    empresa_nombre: empresa.nombre,
                    empresa_ubicacion: empresa.direccion
                } 
            });
        });
    });
});

// Función para generar prefijo único por empresa y ubicación
function generarPrefijoEmpresa(nombre, direccion) {
    // Extraer palabras clave del nombre
    const palabrasNombre = nombre.toLowerCase()
        .replace(/[^a-z\s]/g, '') // Solo letras y espacios
        .split(' ')
        .filter(palabra => palabra.length > 2); // Palabras de más de 2 caracteres
    
    // Extraer código postal o ciudad de la dirección
    const codigoPostal = direccion.match(/\d{5}/)?.[0] || '';
    const ciudad = extraerCiudad(direccion);
    
    // Generar prefijo basado en nombre y ubicación
    let prefijo = '';
    
    if (palabrasNombre.length >= 2) {
        // Usar primeras letras de las dos primeras palabras
        prefijo = palabrasNombre[0].substring(0, 2) + palabrasNombre[1].substring(0, 1);
    } else if (palabrasNombre.length === 1) {
        // Usar primeras 3 letras de la palabra
        prefijo = palabrasNombre[0].substring(0, 3);
    } else {
        // Fallback: usar primeras 3 letras del nombre completo
        prefijo = nombre.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3);
    }
    
    // Agregar identificador de ubicación si es necesario
    if (ciudad) {
        const ciudadCode = ciudad.substring(0, 2).toUpperCase();
        prefijo += ciudadCode;
    } else if (codigoPostal) {
        // Usar últimos 2 dígitos del código postal
        prefijo += codigoPostal.substring(3, 5);
    }
    
    return prefijo.toUpperCase();
}

// Función para extraer ciudad de la dirección
function extraerCiudad(direccion) {
    const ciudadesComunes = [
        'madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza', 'málaga', 'murcia',
        'palma', 'las palmas', 'bilbao', 'alicante', 'córdoba', 'valladolid', 'vigo',
        'gijón', 'hospitalet', 'coruña', 'granada', 'elche', 'santa cruz', 'oviedo',
        'badalona', 'cartagena', 'terrassa', 'jerez', 'sabadell', 'móstoles', 'alcalá',
        'pamplona', 'fuenlabrada', 'almería', 'leganés', 'santander', 'castellón',
        'burgos', 'albacete', 'getafe', 'salamanca', 'huelva', 'marbella', 'logroño',
        'badajoz', 'san sebastián', 'león', 'cádiz', 'tarragona', 'lérida', 'mataró',
        'santa coloma', 'algeciras', 'jaén', 'ourense', 'reus', 'torrelavega', 'el ejido',
        'lugo', 'santiago', 'ceuta', 'melilla', 'canarias', 'baleares', 'andalucía',
        'cataluña', 'galicia', 'castilla', 'aragón', 'extremadura', 'navarra', 'rioja'
    ];
    
    const direccionLower = direccion.toLowerCase();
    
    for (const ciudad of ciudadesComunes) {
        if (direccionLower.includes(ciudad)) {
            return ciudad;
        }
    }
    
    return null;
}

// GET - Obtener factura por ID con detalles
app.get('/api/facturas/:id', (req, res) => {
    const facturaId = req.params.id;
    
    db.get(`
        SELECT f.*, c.nombre as cliente_nombre, c.direccion as cliente_direccion, c.identificacion as cliente_identificacion,
               e.nombre as empresa_nombre, e.cif as empresa_cif, e.direccion as empresa_direccion
        FROM facturas f 
        LEFT JOIN clientes c ON f.cliente_id = c.id 
        LEFT JOIN empresas e ON f.empresa_id = e.id
        WHERE f.id = ?
    `, [facturaId], (err, factura) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!factura) {
            res.status(404).json({ error: 'Factura no encontrada' });
            return;
        }
        
        // Obtener detalles de la factura
        db.all(`
            SELECT df.*, p.codigo, COALESCE(df.descripcion, p.descripcion) as descripcion, COALESCE(df.tipo_impuesto, 'igic') as tipo_impuesto
            FROM detalles_factura df
            LEFT JOIN productos p ON df.producto_id = p.id
            WHERE df.factura_id = ?
        `, [facturaId], (err, detalles) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            factura.detalles = detalles;
            res.json({ success: true, data: factura });
        });
    });
});

// GET - Generar XML VeriFactu para una factura
app.get('/api/facturas/:id/verifactu', async (req, res) => {
    try {
        const facturaId = req.params.id;
        
        // Obtener datos completos de la factura
        const factura = await new Promise((resolve, reject) => {
            db.get(`
                SELECT f.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion,
                       c.direccion as cliente_direccion, c.codigo_postal as cliente_codigo_postal,
                       c.provincia as cliente_provincia, c.pais as cliente_pais,
                       c.codigo_pais as cliente_codigo_pais, c.regimen_fiscal as cliente_regimen_fiscal,
                       e.nombre as empresa_nombre, e.cif as empresa_cif, e.direccion as empresa_direccion,
                       e.codigo_postal as empresa_codigo_postal, e.provincia as empresa_provincia,
                       e.pais as empresa_pais, e.codigo_pais as empresa_codigo_pais,
                       e.regimen_fiscal as empresa_regimen_fiscal
                FROM facturas f 
                LEFT JOIN clientes c ON f.cliente_id = c.id 
                LEFT JOIN empresas e ON f.empresa_id = e.id
                WHERE f.id = ?
            `, [facturaId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!factura) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }
        
        // Obtener detalles de la factura
        const detalles = await new Promise((resolve, reject) => {
            db.all(`
                SELECT df.*, p.codigo, COALESCE(df.descripcion, p.descripcion) as descripcion, COALESCE(df.tipo_impuesto, 'igic') as tipo_impuesto
                FROM detalles_factura df
                LEFT JOIN productos p ON df.producto_id = p.id
                WHERE df.factura_id = ?
            `, [facturaId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        factura.detalles = detalles;
        
        // Generar XML VeriFactu
        const xmlVeriFactu = generadorVeriFactu.generarXMLVeriFactu(factura);
        
        // Validar XML
        const validacion = generadorVeriFactu.validarXMLVeriFactu(xmlVeriFactu);
        
        if (!validacion.valido) {
            return res.status(400).json({ 
                error: 'XML VeriFactu inválido', 
                detalles: validacion.errores 
            });
        }
        
        res.json({
            success: true,
            data: {
                xml: xmlVeriFactu,
                validacion: validacion,
                factura_id: facturaId,
                numero_serie: factura.numero_serie
            }
        });
        
    } catch (error) {
        console.error('❌ Error al generar XML VeriFactu:', error);
        res.status(500).json({ error: 'Error al generar XML VeriFactu' });
    }
});

// POST - Enviar factura a VeriFactu (simulado)
app.post('/api/facturas/:id/enviar-verifactu', async (req, res) => {
    try {
        const facturaId = req.params.id;
        
        // Obtener datos de la factura
        const factura = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM facturas WHERE id = ?', [facturaId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!factura) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }
        
        // Generar XML VeriFactu
        const xmlVeriFactu = generadorVeriFactu.generarXMLVeriFactu(factura);
        
        // Simular envío a AEAT
        const respuestaAEAT = generadorVeriFactu.generarRespuestaAEAT(xmlVeriFactu);
        
        // Actualizar factura con respuesta de AEAT
        db.run('UPDATE facturas SET respuesta_aeat = ?, estado_fiscal = ? WHERE id = ?', 
            [JSON.stringify(respuestaAEAT), respuestaAEAT.valido ? 'enviada' : 'error'], facturaId);
        
        // Registrar en auditoría
        await sistemaAuditoria.registrarOperacion(
            'facturas',
            facturaId,
            'UPDATE',
            { estado_fiscal: factura.estado_fiscal },
            { estado_fiscal: respuestaAEAT.valido ? 'enviada' : 'error', respuesta_aeat: respuestaAEAT },
            'sistema'
        );
        
        res.json({
            success: true,
            data: {
                factura_id: facturaId,
                respuesta_aeat: respuestaAEAT,
                xml_enviado: xmlVeriFactu
            }
        });
        
    } catch (error) {
        console.error('❌ Error al enviar a VeriFactu:', error);
        res.status(500).json({ error: 'Error al enviar a VeriFactu' });
    }
});

// GET - Obtener historial de auditoría de una factura
app.get('/api/facturas/:id/auditoria', async (req, res) => {
    try {
        const facturaId = req.params.id;
        
        const historial = await sistemaAuditoria.obtenerHistorialAuditoria('facturas', facturaId);
        
        res.json({
            success: true,
            data: historial
        });
        
    } catch (error) {
        console.error('❌ Error al obtener historial de auditoría:', error);
        res.status(500).json({ error: 'Error al obtener historial de auditoría' });
    }
});

// GET - Verificar integridad de auditoría
app.get('/api/auditoria/verificar-integridad', async (req, res) => {
    try {
        const resultado = await sistemaAuditoria.verificarIntegridadAuditoria();
        
        res.json({
            success: true,
            data: resultado
        });
        
    } catch (error) {
        console.error('❌ Error al verificar integridad:', error);
        res.status(500).json({ error: 'Error al verificar integridad' });
    }
});

// GET - Listar backups disponibles
app.get('/api/backup/listar', (req, res) => {
    try {
        const backups = sistemaBackup.listarBackups();
        
        res.json({
            success: true,
            data: backups
        });
        
    } catch (error) {
        console.error('❌ Error al listar backups:', error);
        res.status(500).json({ error: 'Error al listar backups' });
    }
});

// POST - Realizar backup manual
app.post('/api/backup/realizar', async (req, res) => {
    try {
        const resultado = await sistemaBackup.realizarBackup();
        
        res.json({
            success: true,
            data: resultado
        });
        
    } catch (error) {
        console.error('❌ Error al realizar backup:', error);
        res.status(500).json({ error: 'Error al realizar backup' });
    }
});

// POST - Restaurar desde backup
app.post('/api/backup/restaurar', async (req, res) => {
    try {
        const { archivo } = req.body;
        
        if (!archivo) {
            return res.status(400).json({ error: 'Archivo de backup requerido' });
        }
        
        const resultado = await sistemaBackup.restaurarBackup(archivo);
        
        res.json({
            success: true,
            data: { restaurado: resultado, archivo }
        });
        
    } catch (error) {
        console.error('❌ Error al restaurar backup:', error);
        res.status(500).json({ error: 'Error al restaurar backup' });
    }
});

// GET - Verificar integridad de backup
app.get('/api/backup/verificar/:archivo', async (req, res) => {
    try {
        const { archivo } = req.params;
        const integridadValida = await sistemaBackup.verificarIntegridadBackup(
            path.join('./backups', archivo)
        );
        
        res.json({
            success: true,
            data: { 
                archivo, 
                integridad_valida: integridadValida 
            }
        });
        
    } catch (error) {
        console.error('❌ Error al verificar integridad del backup:', error);
        res.status(500).json({ error: 'Error al verificar integridad del backup' });
    }
});

// GET - Buscar cliente por identificación
app.get('/api/clientes/buscar/:identificacion', (req, res) => {
    const identificacion = req.params.identificacion;
    
    db.get('SELECT * FROM clientes WHERE identificacion = ?', [identificacion], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: 'Cliente no encontrado' });
            return;
        }
        
        res.json({ success: true, data: row });
    });
});

// GET - Buscar producto por código
app.get('/api/productos/buscar/:codigo', (req, res) => {
    const codigo = req.params.codigo;
    
    db.get('SELECT * FROM productos WHERE codigo = ? AND activo = 1', [codigo], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: 'Producto no encontrado' });
            return;
        }
        
        res.json({ success: true, data: row });
    });
});

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: '🚗 API del Generador de Facturas Telwagen',
        version: '1.0.0',
        endpoints: {
            clientes: '/api/clientes',
            productos: '/api/productos',
            facturas: '/api/facturas',
            siguienteNumero: '/api/facturas/siguiente-numero'
        }
    });
});

// Función para configurar endpoints de seguridad después de la inicialización
function configurarEndpointsSeguridad() {
    // ========================================
    // ENDPOINTS DE SEGURIDAD Y VALIDACIÓN FISCAL
    // ========================================

    // Endpoints de autenticación
    app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        const resultado = await sistemaControlAcceso.autenticar(username, password, ipAddress, userAgent);
        
        // Registrar evento de login
        await sistemaLogsSeguridad.registrarLogin(
            resultado.usuario.id,
            resultado.usuario.username,
            ipAddress,
            userAgent,
            true
        );

        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        // Registrar intento fallido
        await sistemaLogsSeguridad.registrarLogin(
            null,
            req.body.username,
            req.ip || req.connection.remoteAddress,
            req.get('User-Agent'),
            false
        );

        res.status(401).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/auth/logout', sistemaControlAcceso.middlewareAutenticacion(), async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        await sistemaControlAcceso.cerrarSesion(token);
        
        // Registrar evento de logout
        await sistemaLogsSeguridad.registrarLogout(
            req.usuario.id,
            req.usuario.username,
            req.ip || req.connection.remoteAddress
        );

        res.json({ success: true, message: 'Sesión cerrada correctamente' });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoints de cifrado
app.post('/api/cifrado/cifrar', sistemaControlAcceso.middlewareAutenticacion(), 
         sistemaControlAcceso.middlewarePermisos('facturas:crear'), async (req, res) => {
    try {
        const { datos } = req.body;
        const resultado = sistemaCifrado.cifrar(datos);
        
        // Registrar evento de cifrado
        await sistemaLogsSeguridad.registrarCifrado(
            req.usuario.id,
            req.usuario.username,
            'cifrar',
            'datos_sensibles',
            req.ip || req.connection.remoteAddress
        );

        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/cifrado/descifrar', sistemaControlAcceso.middlewareAutenticacion(), 
         sistemaControlAcceso.middlewarePermisos('facturas:leer'), async (req, res) => {
    try {
        const { datosCifrados } = req.body;
        const resultado = sistemaCifrado.descifrar(datosCifrados);
        
        // Registrar evento de descifrado
        await sistemaLogsSeguridad.registrarCifrado(
            req.usuario.id,
            req.usuario.username,
            'descifrar',
            'datos_sensibles',
            req.ip || req.connection.remoteAddress
        );

        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoints de validación fiscal
app.post('/api/validacion/nif', async (req, res) => {
    try {
        const { nif } = req.body;
        const resultado = sistemaValidacionFiscal.validarNIF(nif);
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/validacion/cif', async (req, res) => {
    try {
        const { cif } = req.body;
        const resultado = sistemaValidacionFiscal.validarCIF(cif);
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/validacion/nie', async (req, res) => {
    try {
        const { nie } = req.body;
        const resultado = sistemaValidacionFiscal.validarNIE(nie);
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/validacion/identificacion', async (req, res) => {
    try {
        const { identificacion } = req.body;
        const resultado = sistemaValidacionFiscal.validarIdentificacionFiscal(identificacion);
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/validacion/pais', async (req, res) => {
    try {
        const { codigo } = req.body;
        const resultado = sistemaValidacionFiscal.validarCodigoPais(codigo);
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/validacion/provincia', async (req, res) => {
    try {
        const { provincia } = req.body;
        const resultado = sistemaValidacionFiscal.validarProvincia(provincia);
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/validacion/cliente', async (req, res) => {
    try {
        const datos = req.body;
        const resultado = sistemaValidacionFiscal.validarDatosFiscalesCliente(datos);
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/validacion/empresa', async (req, res) => {
    try {
        const datos = req.body;
        const resultado = sistemaValidacionFiscal.validarDatosFiscalesEmpresa(datos);
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoints de información de validación
app.get('/api/validacion/paises', (req, res) => {
    res.json({
        success: true,
        data: sistemaValidacionFiscal.obtenerPaises()
    });
});

app.get('/api/validacion/provincias', (req, res) => {
    res.json({
        success: true,
        data: sistemaValidacionFiscal.obtenerProvinciasEspana()
    });
});

app.get('/api/validacion/regimenes', (req, res) => {
    res.json({
        success: true,
        data: sistemaValidacionFiscal.obtenerRegimenesFiscales()
    });
});

// Endpoints de logs de seguridad
app.get('/api/logs-seguridad', sistemaControlAcceso.middlewareAutenticacion(), 
        sistemaControlAcceso.middlewarePermisos('auditoria:leer'), async (req, res) => {
    try {
        const filtros = req.query;
        const logs = await sistemaLogsSeguridad.obtenerLogs(filtros);
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/logs-seguridad/estadisticas', sistemaControlAcceso.middlewareAutenticacion(), 
        sistemaControlAcceso.middlewarePermisos('auditoria:leer'), async (req, res) => {
    try {
        const { fechaDesde, fechaHasta } = req.query;
        const estadisticas = await sistemaLogsSeguridad.obtenerEstadisticas(fechaDesde, fechaHasta);
        res.json({ success: true, data: estadisticas });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/logs-seguridad/verificar-integridad', sistemaControlAcceso.middlewareAutenticacion(), 
        sistemaControlAcceso.middlewarePermisos('auditoria:verificar'), async (req, res) => {
    try {
        const resultado = await sistemaLogsSeguridad.verificarIntegridadLogs();
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoints de gestión de usuarios
app.get('/api/usuarios', sistemaControlAcceso.middlewareAutenticacion(), 
        sistemaControlAcceso.middlewarePermisos('usuarios:leer'), async (req, res) => {
    try {
        const query = 'SELECT id, username, rol, nombre, email, activo, ultimo_acceso FROM usuarios WHERE activo = 1';
        db.all(query, [], (err, rows) => {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
                return;
            }
            res.json({ success: true, data: rows });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/usuarios', sistemaControlAcceso.middlewareAutenticacion(), 
         sistemaControlAcceso.middlewarePermisos('usuarios:crear'), async (req, res) => {
    try {
        const datosUsuario = req.body;
        const resultado = await sistemaControlAcceso.crearUsuario(datosUsuario);
        
        // Registrar evento de creación de usuario
        await sistemaLogsSeguridad.registrarGestionUsuario(
            req.usuario.id,
            req.usuario.username,
            'crear',
            datosUsuario.username,
            req.ip || req.connection.remoteAddress
        );

        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

    app.get('/api/roles', (req, res) => {
        res.json({
            success: true,
            data: sistemaControlAcceso.obtenerRoles()
        });
    });

    // ========================================
    // ENDPOINTS DE FIRMA DIGITAL
    // ========================================

    // Información del certificado
    app.get('/api/firma-digital/certificado', (req, res) => {
        try {
            const info = sistemaFirmaDigital.obtenerInformacionCertificado();
            res.json({ success: true, data: info });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Firmar documento
    app.post('/api/firma-digital/firmar', async (req, res) => {
        try {
            const { datosDocumento } = req.body;
            const firma = sistemaFirmaDigital.firmarDocumento(datosDocumento);
            res.json({ success: true, data: firma });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Verificar firma
    app.post('/api/firma-digital/verificar', async (req, res) => {
        try {
            const { firmaCompleta, datosDocumento } = req.body;
            const verificacion = sistemaFirmaDigital.verificarFirma(firmaCompleta, datosDocumento);
            res.json({ success: true, data: verificacion });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Firmar factura específica
    app.post('/api/facturas/:id/firmar', async (req, res) => {
        try {
            const facturaId = req.params.id;
            
            // Obtener datos de la factura
            const factura = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT f.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion,
                           e.nombre as empresa_nombre, e.cif as empresa_cif, e.direccion as empresa_direccion
                    FROM facturas f 
                    LEFT JOIN clientes c ON f.cliente_id = c.id 
                    LEFT JOIN empresas e ON f.empresa_id = e.id
                    WHERE f.id = ?
                `, [facturaId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!factura) {
                return res.status(404).json({
                    success: false,
                    error: 'Factura no encontrada'
                });
            }

            // Obtener productos de la factura
            const productos = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT df.*, p.descripcion as producto_descripcion
                    FROM detalles_factura df
                    LEFT JOIN productos p ON df.producto_id = p.id
                    WHERE df.factura_id = ?
                `, [facturaId], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            // Preparar datos para firma
            const datosFactura = {
                ...factura,
                productos: productos
            };

            // Firmar factura
            const firmaDigital = sistemaFirmaDigital.firmarFactura(datosFactura);

            // Actualizar factura con información de firma
            await new Promise((resolve, reject) => {
                db.run('UPDATE facturas SET respuesta_aeat = ? WHERE id = ?', 
                    [JSON.stringify({ firma_digital: firmaDigital.firma, archivo_firma: firmaDigital.archivo }), facturaId], 
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
            });

            res.json({ 
                success: true, 
                data: {
                    factura_id: facturaId,
                    numero_factura: factura.numero_factura,
                    firma: firmaDigital.firma,
                    archivo: firmaDigital.archivo,
                    timestamp: firmaDigital.timestamp
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Verificar firma de factura
    app.get('/api/facturas/:id/verificar-firma', async (req, res) => {
        try {
            const facturaId = req.params.id;
            
            // Obtener datos de la factura
            const factura = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT f.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion,
                           e.nombre as empresa_nombre, e.cif as empresa_cif, e.direccion as empresa_direccion
                    FROM facturas f 
                    LEFT JOIN clientes c ON f.cliente_id = c.id 
                    LEFT JOIN empresas e ON f.empresa_id = e.id
                    WHERE f.id = ?
                `, [facturaId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!factura) {
                return res.status(404).json({
                    success: false,
                    error: 'Factura no encontrada'
                });
            }

            // Obtener productos de la factura
            const productos = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT df.*, p.descripcion as producto_descripcion
                    FROM detalles_factura df
                    LEFT JOIN productos p ON df.producto_id = p.id
                    WHERE df.factura_id = ?
                `, [facturaId], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            // Preparar datos para verificación
            const datosFactura = {
                ...factura,
                productos: productos
            };

            // Verificar si tiene firma digital
            let firmaCompleta = null;
            if (factura.respuesta_aeat) {
                try {
                    const respuestaAEAT = JSON.parse(factura.respuesta_aeat);
                    if (respuestaAEAT.firma_digital) {
                        firmaCompleta = respuestaAEAT.firma_digital;
                    }
                } catch (error) {
                    console.warn('⚠️ Error al parsear respuesta AEAT:', error.message);
                }
            }

            if (!firmaCompleta) {
                return res.json({
                    success: true,
                    data: {
                        factura_id: facturaId,
                        numero_factura: factura.numero_factura,
                        tiene_firma: false,
                        mensaje: 'La factura no tiene firma digital'
                    }
                });
            }

            // Verificar firma
            const verificacion = sistemaFirmaDigital.verificarFactura(datosFactura, firmaCompleta);

            res.json({ 
                success: true, 
                data: verificacion
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Listar firmas generadas
    app.get('/api/firma-digital/firmas', (req, res) => {
        try {
            const firmas = sistemaFirmaDigital.listarFirmas();
            res.json({ success: true, data: firmas });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Cargar firma específica
    app.get('/api/firma-digital/firmas/:archivo', (req, res) => {
        try {
            const archivo = req.params.archivo;
            const firma = sistemaFirmaDigital.cargarFirma(archivo);
            res.json({ success: true, data: firma });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Generar certificado de producción
    app.post('/api/firma-digital/certificado-produccion', async (req, res) => {
        try {
            const datosEmpresa = req.body;
            const certificado = sistemaFirmaDigital.generarCertificadoProduccion(datosEmpresa);
            res.json({ success: true, data: certificado });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
}

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal!' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend iniciado en puerto ${PORT}`);
    console.log(`📡 API disponible en: http://localhost:${PORT}`);
    console.log(`📋 Documentación: http://localhost:${PORT}/`);
});

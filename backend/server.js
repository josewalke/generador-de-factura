const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

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
                numero_factura TEXT UNIQUE NOT NULL,
                cliente_id INTEGER,
                fecha_emision DATE NOT NULL,
                fecha_vencimiento DATE,
                subtotal REAL NOT NULL,
                igic REAL NOT NULL,
                total REAL NOT NULL,
                estado TEXT DEFAULT 'pendiente',
                notas TEXT,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cliente_id) REFERENCES clientes (id)
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
                FOREIGN KEY (factura_id) REFERENCES facturas (id),
                FOREIGN KEY (producto_id) REFERENCES productos (id)
            )
        `, (err) => {
            if (err) {
                console.error('❌ Error al crear tabla detalles_factura:', err.message);
            } else {
                console.log('✅ Tabla detalles_factura creada/verificada');
                // Insertar datos de ejemplo después de crear todas las tablas
                insertSampleData();
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
        SELECT f.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion
        FROM facturas f 
        LEFT JOIN clientes c ON f.cliente_id = c.id 
        ORDER BY f.fecha_emision DESC
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// POST - Crear nueva factura
app.post('/api/facturas', (req, res) => {
    const { 
        numero_factura, 
        cliente_id, 
        fecha_emision, 
        fecha_vencimiento, 
        subtotal, 
        igic, 
        total, 
        notas,
        productos 
    } = req.body;
    
    db.run(`
        INSERT INTO facturas (numero_factura, cliente_id, fecha_emision, fecha_vencimiento, subtotal, igic, total, notas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [numero_factura, cliente_id, fecha_emision, fecha_vencimiento, subtotal, igic, total, notas], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const facturaId = this.lastID;
        
        // Insertar detalles de la factura
        if (productos && productos.length > 0) {
            productos.forEach(producto => {
                db.run(`
                    INSERT INTO detalles_factura (factura_id, producto_id, cantidad, precio_unitario, subtotal, igic, total)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [facturaId, producto.id, producto.cantidad, producto.precioUnitario, producto.subtotal, producto.igic, producto.total]);
            });
        }
        
        res.json({ 
            success: true, 
            data: { 
                id: facturaId, 
                numero_factura, 
                total 
            } 
        });
    });
});

// GET - Generar siguiente número de factura
app.get('/api/facturas/siguiente-numero', (req, res) => {
    const año = new Date().getFullYear();
    
    db.get(`
        SELECT MAX(CAST(SUBSTR(numero_factura, 2, 3) AS INTEGER)) as ultimo_numero
        FROM facturas 
        WHERE numero_factura LIKE 'C%/${año}'
    `, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const siguienteNumero = (row.ultimo_numero || 0) + 1;
        const numeroFormateado = `C${siguienteNumero.toString().padStart(3, '0')}/${año}`;
        
        res.json({ success: true, data: { numero_factura: numeroFormateado } });
    });
});

// GET - Obtener factura por ID con detalles
app.get('/api/facturas/:id', (req, res) => {
    const facturaId = req.params.id;
    
    db.get(`
        SELECT f.*, c.nombre as cliente_nombre, c.direccion as cliente_direccion, c.identificacion as cliente_identificacion
        FROM facturas f 
        LEFT JOIN clientes c ON f.cliente_id = c.id 
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
            SELECT df.*, p.codigo, p.descripcion
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

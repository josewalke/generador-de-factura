-- Migración para crear tabla de abonos (notas de crédito)
-- Los abonos se crean automáticamente cuando se anula una factura

-- Crear tabla de abonos
CREATE TABLE IF NOT EXISTS abonos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_abono TEXT NOT NULL,
    factura_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    cliente_id INTEGER,
    fecha_emision DATE NOT NULL,
    subtotal REAL NOT NULL,
    igic REAL NOT NULL,
    total REAL NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    notas TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    -- Campos de Ley Antifraude (opcionales para abonos)
    numero_serie TEXT,
    fecha_operacion DATE,
    tipo_documento TEXT DEFAULT 'abono',
    metodo_pago TEXT,
    referencia_operacion TEXT,
    hash_documento TEXT,
    sellado_temporal DATETIME,
    estado_fiscal TEXT DEFAULT 'pendiente',
    codigo_verifactu TEXT,
    respuesta_aeat TEXT,
    FOREIGN KEY (factura_id) REFERENCES facturas (id),
    FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    FOREIGN KEY (cliente_id) REFERENCES clientes (id),
    UNIQUE(numero_abono, empresa_id)
);

-- Crear tabla de detalles de abono
CREATE TABLE IF NOT EXISTS detalles_abono (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    abono_id INTEGER NOT NULL,
    producto_id INTEGER,
    coche_id INTEGER,
    cantidad INTEGER NOT NULL,
    precio_unitario REAL NOT NULL,
    subtotal REAL NOT NULL,
    igic REAL NOT NULL,
    total REAL NOT NULL,
    descripcion TEXT,
    tipo_impuesto TEXT DEFAULT 'igic',
    FOREIGN KEY (abono_id) REFERENCES abonos (id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos (id),
    FOREIGN KEY (coche_id) REFERENCES coches (id)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_abonos_factura_id ON abonos(factura_id);
CREATE INDEX IF NOT EXISTS idx_abonos_empresa_id ON abonos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_abonos_cliente_id ON abonos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_abonos_fecha_emision ON abonos(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_abonos_estado ON abonos(estado);
CREATE INDEX IF NOT EXISTS idx_detalles_abono_abono_id ON detalles_abono(abono_id);


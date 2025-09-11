-- Crear tabla para sellados temporales
CREATE TABLE IF NOT EXISTS sellados_temporales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    documento_id INTEGER NOT NULL,
    tipo_documento TEXT NOT NULL DEFAULT 'factura',
    timestamp DATETIME NOT NULL,
    hash_sellado TEXT NOT NULL,
    hash_documento TEXT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (documento_id) REFERENCES facturas (id)
);

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_sellados_documento ON sellados_temporales(documento_id);
CREATE INDEX IF NOT EXISTS idx_sellados_timestamp ON sellados_temporales(timestamp);
CREATE INDEX IF NOT EXISTS idx_sellados_hash ON sellados_temporales(hash_sellado);

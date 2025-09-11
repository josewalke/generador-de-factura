-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_facturas_numero_serie ON facturas(numero_serie);
CREATE INDEX IF NOT EXISTS idx_facturas_hash ON facturas(hash_documento);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha_operacion ON facturas(fecha_operacion);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo_id ON clientes(tipo_identificacion);
CREATE INDEX IF NOT EXISTS idx_empresas_codigo_pais ON empresas(codigo_pais);

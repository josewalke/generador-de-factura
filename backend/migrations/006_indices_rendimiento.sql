-- Índices adicionales para optimizar rendimiento de queries frecuentes
-- Estos índices mejoran significativamente el rendimiento de búsquedas y filtros

-- Índices para facturas (queries más frecuentes)
CREATE INDEX IF NOT EXISTS idx_facturas_empresa_id ON facturas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente_id ON facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha_emision ON facturas(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_activo ON facturas(activo);
CREATE INDEX IF NOT EXISTS idx_facturas_empresa_estado ON facturas(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha_estado ON facturas(fecha_emision, estado);
CREATE INDEX IF NOT EXISTS idx_facturas_numero_empresa ON facturas(numero_factura, empresa_id);

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_identificacion ON clientes(identificacion);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);

-- Índices para coches
CREATE INDEX IF NOT EXISTS idx_coches_matricula ON coches(matricula);
CREATE INDEX IF NOT EXISTS idx_coches_activo ON coches(activo);
CREATE INDEX IF NOT EXISTS idx_coches_modelo ON coches(modelo);

-- Índices para productos
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_activo ON productos(codigo, activo);

-- Índices para empresas
CREATE INDEX IF NOT EXISTS idx_empresas_cif ON empresas(cif);
CREATE INDEX IF NOT EXISTS idx_empresas_activo ON empresas(activo);
CREATE INDEX IF NOT EXISTS idx_empresas_nombre ON empresas(nombre);

-- Índices para proformas
CREATE INDEX IF NOT EXISTS idx_proformas_empresa_id ON proformas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_proformas_cliente_id ON proformas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proformas_fecha_emision ON proformas(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_proformas_estado ON proformas(estado);
CREATE INDEX IF NOT EXISTS idx_proformas_activo ON proformas(activo);
CREATE INDEX IF NOT EXISTS idx_proformas_factura_id ON proformas(factura_id);

-- Índices para abonos
CREATE INDEX IF NOT EXISTS idx_abonos_factura_id ON abonos(factura_id);
CREATE INDEX IF NOT EXISTS idx_abonos_fecha ON abonos(fecha);
CREATE INDEX IF NOT EXISTS idx_abonos_activo ON abonos(activo);

-- Índices para detalles de facturas
CREATE INDEX IF NOT EXISTS idx_factura_detalles_factura_id ON factura_detalles(factura_id);
CREATE INDEX IF NOT EXISTS idx_factura_detalles_producto_id ON factura_detalles(producto_id);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- Índices para auditoría (mejora rendimiento de consultas de logs)
CREATE INDEX IF NOT EXISTS idx_audit_log_tabla ON audit_log(tabla);
CREATE INDEX IF NOT EXISTS idx_audit_log_registro_id ON audit_log(registro_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_fecha ON audit_log(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_audit_log_usuario ON audit_log(usuario_id);

-- Índices para logs de seguridad
CREATE INDEX IF NOT EXISTS idx_logs_seguridad_usuario ON logs_seguridad(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_seguridad_tipo ON logs_seguridad(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_logs_seguridad_fecha ON logs_seguridad(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_logs_seguridad_nivel ON logs_seguridad(nivel);


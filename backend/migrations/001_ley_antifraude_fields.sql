-- Migración para cumplir con la Ley Antifraude España
-- Campos obligatorios para facturas

-- Agregar campos obligatorios a la tabla facturas
ALTER TABLE facturas ADD COLUMN numero_serie TEXT;
ALTER TABLE facturas ADD COLUMN fecha_operacion DATE;
ALTER TABLE facturas ADD COLUMN tipo_documento TEXT DEFAULT 'factura';
ALTER TABLE facturas ADD COLUMN metodo_pago TEXT DEFAULT 'transferencia';
ALTER TABLE facturas ADD COLUMN referencia_operacion TEXT;
ALTER TABLE facturas ADD COLUMN hash_documento TEXT;
ALTER TABLE facturas ADD COLUMN sellado_temporal DATETIME;
ALTER TABLE facturas ADD COLUMN estado_fiscal TEXT DEFAULT 'pendiente';
ALTER TABLE facturas ADD COLUMN codigo_verifactu TEXT;
ALTER TABLE facturas ADD COLUMN respuesta_aeat TEXT;

-- Agregar campos fiscales obligatorios a clientes
ALTER TABLE clientes ADD COLUMN tipo_identificacion TEXT DEFAULT 'NIF';
ALTER TABLE clientes ADD COLUMN codigo_pais TEXT DEFAULT 'ES';
ALTER TABLE clientes ADD COLUMN provincia TEXT;
ALTER TABLE clientes ADD COLUMN pais TEXT DEFAULT 'España';
ALTER TABLE clientes ADD COLUMN regimen_fiscal TEXT DEFAULT 'general';

-- Agregar campos fiscales obligatorios a empresas
ALTER TABLE empresas ADD COLUMN codigo_pais TEXT DEFAULT 'ES';
ALTER TABLE empresas ADD COLUMN provincia TEXT;
ALTER TABLE empresas ADD COLUMN pais TEXT DEFAULT 'España';
ALTER TABLE empresas ADD COLUMN regimen_fiscal TEXT DEFAULT 'general';
ALTER TABLE empresas ADD COLUMN codigo_postal TEXT;

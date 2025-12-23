-- Migración para agregar relación directa entre facturas y proformas
-- Permite que las facturas estén relacionadas con proformas y que las facturas hijas hereden esta relación

-- Agregar columna proforma_id a la tabla facturas
ALTER TABLE facturas ADD COLUMN proforma_id INTEGER;

-- Agregar foreign key constraint (si la tabla proformas existe)
-- Nota: Esto puede fallar si la tabla proformas no existe, pero es seguro ignorarlo
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proformas') THEN
        ALTER TABLE facturas 
        ADD CONSTRAINT fk_facturas_proforma 
        FOREIGN KEY (proforma_id) REFERENCES proformas(id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignorar si la constraint ya existe o si hay algún error
        NULL;
END $$;

-- Crear índice para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_facturas_proforma_id ON facturas(proforma_id);

-- Para SQLite (si se usa SQLite en lugar de PostgreSQL)
-- ALTER TABLE facturas ADD COLUMN proforma_id INTEGER;
-- CREATE INDEX IF NOT EXISTS idx_facturas_proforma_id ON facturas(proforma_id);











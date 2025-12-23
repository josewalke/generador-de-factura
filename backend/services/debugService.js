class DebugService {
    constructor(db, logger) {
        this.db = db;
        this.logger = logger;
    }

    /**
     * Verificar relación entre productos y coches
     */
    async getProductosCoches() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    p.id as producto_id,
                    p.descripcion as producto_descripcion,
                    c.id as coche_id,
                    c.matricula as coche_matricula,
                    c.modelo as coche_modelo,
                    c.color as coche_color,
                    c.kms as coche_kms,
                    c.chasis as coche_chasis,
                    CASE WHEN c.id IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_coche
                FROM productos p
                LEFT JOIN coches c ON (p.descripcion LIKE '%' || c.matricula || '%')
                ORDER BY p.id
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    /**
     * Verificar relación entre facturas y coches
     */
    async getFacturasCoches() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    f.id as factura_id,
                    f.numero_factura,
                    f.fecha_emision,
                    df.id as detalle_id,
                    df.descripcion as detalle_descripcion,
                    p.id as producto_id,
                    p.descripcion as producto_descripcion,
                    c.id as coche_id,
                    c.matricula as coche_matricula,
                    c.modelo as coche_modelo,
                    CASE WHEN c.id IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_coche_relacionado
                FROM facturas f
                LEFT JOIN detalles_factura df ON f.id = df.factura_id
                LEFT JOIN productos p ON df.producto_id = p.id
                LEFT JOIN coches c ON (COALESCE(df.descripcion, p.descripcion) LIKE '%' || c.matricula || '%')
                ORDER BY f.id, df.id
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }
}

module.exports = DebugService;




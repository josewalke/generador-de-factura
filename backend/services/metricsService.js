const config = require('../config/config');

class MetricsService {
    constructor(db, logger) {
        this.db = db;
        this.logger = logger;
    }

    /**
     * Ejecutar query y obtener resultado
     */
    async runGet(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /**
     * Obtener resumen de métricas
     */
    async getResumen() {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            const dbType = config.get('database.type') || 'postgresql';
            const activoValue = dbType === 'postgresql' ? 'true' : '1';
            
            const [
                clientesRow,
                cochesRow,
                empresasRow,
                facturasRow,
                ingresosRow
            ] = await Promise.all([
                this.runGet('SELECT COUNT(*) as count FROM clientes'),
                this.runGet('SELECT COUNT(*) as count FROM coches'),
                this.runGet('SELECT COUNT(*) as count FROM empresas'),
                this.runGet('SELECT COUNT(*) as count FROM facturas WHERE (activo = ? OR activo IS NULL) AND (estado IS NULL OR estado != ?)', [activoValue, 'anulado']),
                this.runGet(
                    `SELECT COALESCE(SUM(total), 0) as total
                     FROM facturas
                     WHERE estado = ?
                       AND (activo = ? OR activo IS NULL)
                       AND (estado IS NULL OR estado != ?)
                       AND fecha_emision >= ? AND fecha_emision <= ?`,
                    ['pagada', activoValue, 'anulado', startOfMonth, endOfMonth]
                )
            ]);
            
            return {
                totalClientes: Number(clientesRow.count || 0),
                totalCoches: Number(cochesRow.count || 0),
                totalFacturas: Number(facturasRow.count || 0),
                totalEmpresas: Number(empresasRow.count || 0),
                ingresosMes: Number(ingresosRow.total || 0)
            };
        } catch (error) {
            this.logger.error('Error obteniendo métricas', { error: error.message, stack: error.stack });
            throw error;
        }
    }
}

module.exports = MetricsService;




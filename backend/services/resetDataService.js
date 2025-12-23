class ResetDataService {
    constructor(db, logger, insertSampleDataFn) {
        this.db = db;
        this.logger = logger;
        this.insertSampleDataFn = insertSampleDataFn;
    }

    /**
     * Limpiar y recrear datos de ejemplo
     */
    async resetData() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                const tables = [
                    'empresas',
                    'productos',
                    'clientes',
                    'coches',
                    'facturas',
                    'detalles_factura'
                ];

                let completed = 0;
                let hasError = false;

                tables.forEach(table => {
                    this.db.run(`DELETE FROM ${table}`, (err) => {
                        if (err && !hasError) {
                            hasError = true;
                            this.logger.error(`Error al limpiar ${table}`, { error: err.message });
                            reject(err);
                        } else if (!err) {
                            this.logger.info(`Tabla ${table} limpiada`);
                        }
                        
                        completed++;
                        if (completed === tables.length && !hasError) {
                            // Recrear datos de ejemplo después de limpiar
                            setTimeout(() => {
                                try {
                                    this.insertSampleDataFn();
                                    resolve({ success: true, message: 'Datos de ejemplo recreados correctamente' });
                                } catch (error) {
                                    reject(error);
                                }
                            }, 1000);
                        }
                    });
                });
            });
        });
    }
}

module.exports = ResetDataService;


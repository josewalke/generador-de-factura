const path = require('path');
const fs = require('fs');
const config = require('../config/config');

class ImportExportService {
    constructor(db, logger, importadorExcel) {
        this.db = db;
        this.logger = logger;
        this.importadorExcel = importadorExcel;
    }

    /**
     * Importar coches desde Excel
     */
    async importarCoches(filePath) {
        const startTime = Date.now();
        
        try {
            // Verificar coches actuales antes de importar
            const dbType = config.get('database.type') || 'postgresql';
            const activoValue = dbType === 'postgresql' ? true : 1;
            
            const cochesActuales = await new Promise((resolve, reject) => {
                this.db.all('SELECT COUNT(*) as total FROM coches WHERE activo = ?', [activoValue], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows[0]?.total || 0);
                });
            });
            
            this.logger.info(`Coches actuales en la base de datos: ${cochesActuales}`);
            
            // Importar
            const resultado = await this.importadorExcel.importarCoches(filePath);
            const duration = Date.now() - startTime;
            
            this.logger.info('Importación de coches completada', {
                success: resultado.success,
                total: resultado.total,
                importados: resultado.importados,
                errores: resultado.errores,
                duration: `${duration}ms`
            });
            
            return resultado;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error importando coches', {
                error: error.message,
                stack: error.stack,
                duration: `${duration}ms`
            });
            throw error;
        }
    }

    /**
     * Importar productos desde Excel
     */
    async importarProductos(filePath) {
        const startTime = Date.now();
        
        try {
            const resultado = await this.importadorExcel.importarProductos(filePath);
            const duration = Date.now() - startTime;
            
            this.logger.importOperation('productos', path.basename(filePath), resultado.total || 0, resultado.success, resultado.errors || []);
            
            return resultado;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error importando productos', {
                error: error.message,
                stack: error.stack,
                duration: `${duration}ms`
            });
            throw error;
        }
    }

    /**
     * Importar clientes desde Excel
     */
    async importarClientes(filePath) {
        const startTime = Date.now();
        
        try {
            const resultado = await this.importadorExcel.importarClientes(filePath);
            const duration = Date.now() - startTime;
            
            this.logger.importOperation('clientes', path.basename(filePath), resultado.total || 0, resultado.success, resultado.errors || []);
            
            return resultado;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error importando clientes', {
                error: error.message,
                stack: error.stack,
                duration: `${duration}ms`
            });
            throw error;
        }
    }

    /**
     * Generar plantilla Excel
     */
    generarPlantilla(tipo, filePath) {
        const tiposValidos = ['coches', 'productos', 'clientes'];
        
        if (!tiposValidos.includes(tipo)) {
            throw new Error('Tipo de plantilla no válido');
        }
        
        // Crear directorio temp si no existe
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        this.importadorExcel.generarPlantilla(tipo, filePath);
    }

    /**
     * Exportar coches a Excel
     */
    async exportarCoches(filePath, filtros = {}) {
        try {
            // Crear directorio temp si no existe
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const resultado = await this.importadorExcel.exportarCoches(filePath, filtros);
            return resultado;
        } catch (error) {
            this.logger.error('Error exportando coches', { error: error.message });
            throw error;
        }
    }

    /**
     * Exportar productos a Excel
     */
    async exportarProductos(filePath, filtros = {}) {
        try {
            // Crear directorio temp si no existe
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const resultado = await this.importadorExcel.exportarProductos(filePath, filtros);
            return resultado;
        } catch (error) {
            this.logger.error('Error exportando productos', { error: error.message });
            throw error;
        }
    }

    /**
     * Exportar clientes a Excel
     */
    async exportarClientes(filePath, filtros = {}) {
        try {
            // Crear directorio temp si no existe
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const resultado = await this.importadorExcel.exportarClientes(filePath, filtros);
            return resultado;
        } catch (error) {
            this.logger.error('Error exportando clientes', { error: error.message });
            throw error;
        }
    }
}

module.exports = ImportExportService;




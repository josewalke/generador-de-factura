class PerformanceService {
    constructor(cacheManager, paginationManager, preheatCacheFn) {
        this.cacheManager = cacheManager;
        this.paginationManager = paginationManager;
        this.preheatCacheFn = preheatCacheFn;
    }

    /**
     * Obtener estadísticas de rendimiento
     */
    getStats() {
        const cacheStats = this.cacheManager.getStats();
        const memoryUsage = process.memoryUsage();
        
        return {
            cache: cacheStats,
            memory: {
                rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
                external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
            },
            uptime: Math.round(process.uptime()) + ' seconds',
            nodeVersion: process.version,
            platform: process.platform
        };
    }

    /**
     * Limpiar caché
     */
    clearCache(pattern = null) {
        if (pattern) {
            const deletedCount = this.cacheManager.delPattern(pattern);
            return { message: `Cache cleared for pattern: ${pattern}`, deletedCount };
        } else {
            this.cacheManager.flush();
            return { message: 'All cache cleared' };
        }
    }

    /**
     * Limpiar caché de coches
     */
    clearCochesCache() {
        if (this.cacheManager) {
            const deletedCount = this.cacheManager.delPattern('coches:*');
            return { message: 'Caché de coches limpiado correctamente', deletedCount };
        } else {
            throw new Error('Cache manager no disponible');
        }
    }

    /**
     * Obtener estadísticas de caché
     */
    getCacheStats() {
        return this.cacheManager.getStats();
    }

    /**
     * Precalentar caché
     */
    async preheatCache() {
        if (this.preheatCacheFn) {
            await this.preheatCacheFn();
        } else {
            throw new Error('Función de precalentamiento no disponible');
        }
    }

    /**
     * Analizar rendimiento de consulta (solo desarrollo)
     */
    async analyzeQuery(query, params = []) {
        // Validar que la query no contenga comandos peligrosos
        const dangerousCommands = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'EXEC', 'EXECUTE'];
        const queryUpper = query.toUpperCase();
        
        if (dangerousCommands.some(cmd => queryUpper.includes(cmd))) {
            throw new Error('Query contains dangerous commands');
        }
        
        return await this.paginationManager.analyzeQueryPerformance(query, params);
    }
}

module.exports = PerformanceService;




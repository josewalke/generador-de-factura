// Sistema de Caché Avanzado para Mejora de Rendimiento
const NodeCache = require('node-cache');
const fs = require('fs');
const path = require('path');

class CacheManager {
    constructor(config) {
        this.config = config;
        this.cache = new NodeCache({
            stdTTL: config.cache.ttl,
            maxKeys: config.cache.maxSize,
            useClones: false
        });
        
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
        
        this.setupEventListeners();
    }

    /**
     * Configura los event listeners del caché
     */
    setupEventListeners() {
        this.cache.on('set', (key, value) => {
            this.stats.sets++;
            // Solo logear operaciones importantes
            if (key.includes('empresas:all') || key.includes('productos:all')) {
                console.log(`📦 Cache SET: ${key}`);
            }
        });

        this.cache.on('del', (key, value) => {
            this.stats.deletes++;
            // Solo logear eliminaciones importantes
            if (key.includes('empresas:') || key.includes('productos:')) {
                console.log(`🗑️ Cache DEL: ${key}`);
            }
        });

        this.cache.on('expired', (key, value) => {
            // Solo logear expiraciones importantes
            if (key.includes('empresas:all') || key.includes('productos:all')) {
                console.log(`⏰ Cache EXPIRED: ${key}`);
            }
        });
    }

    /**
     * Obtiene un valor del caché
     */
    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            this.stats.hits++;
            // Solo logear hits importantes
            if (key.includes('empresas:all') || key.includes('productos:all')) {
                console.log(`✅ Cache HIT: ${key}`);
            }
            return value;
        } else {
            this.stats.misses++;
            // Solo logear misses importantes
            if (key.includes('empresas:all') || key.includes('productos:all')) {
                console.log(`❌ Cache MISS: ${key}`);
            }
            return null;
        }
    }

    /**
     * Establece un valor en el caché
     */
    set(key, value, ttl = null) {
        const options = ttl ? { ttl } : {};
        this.cache.set(key, value, options);
        return true;
    }

    /**
     * Elimina un valor del caché
     */
    del(key) {
        return this.cache.del(key);
    }

    /**
     * Elimina múltiples valores del caché usando un patrón
     * @param {string} pattern - Patrón a buscar (puede usar * como wildcard)
     */
    invalidatePattern(pattern) {
        const keys = this.cache.keys();
        // Convertir patrón con * a regex
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`);
        const keysToDelete = keys.filter(key => regex.test(key));
        
        keysToDelete.forEach(key => this.del(key));
        if (keysToDelete.length > 0) {
            console.log(`🔄 Cache invalidated: ${pattern} (${keysToDelete.length} keys)`);
        }
        return keysToDelete.length;
    }

    /**
     * Elimina múltiples valores del caché (alias para compatibilidad)
     */
    delPattern(pattern) {
        return this.invalidatePattern(pattern);
    }

    /**
     * Limpia todo el caché
     */
    flush() {
        this.cache.flushAll();
        this.resetStats();
    }

    /**
     * Obtiene estadísticas del caché
     */
    getStats() {
        const keys = this.cache.keys();
        return {
            ...this.stats,
            totalKeys: keys.length,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
            memoryUsage: process.memoryUsage()
        };
    }

    /**
     * Resetea las estadísticas
     */
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
    }

    /**
     * Invalida caché basado en cambios en la base de datos
     * @param {string} table - Nombre de la tabla que cambió
     * @param {string} operation - Tipo de operación (insert, update, delete, truncate)
     */
    invalidateByTableChange(table, operation) {
        const patterns = {
            'coches': ['coches:*', 'coches:all', 'coches:disponibles', 'coches:vendidos', 'query:coches:*'],
            'clientes': ['clientes:*', 'clientes:all', 'query:clientes:*'],
            'productos': ['productos:*', 'productos:all', 'query:productos:*'],
            'facturas': ['facturas:*', 'facturas:all', 'query:facturas:*', 'proformas:*', 'query:proformas:*'],
            'proformas': ['proformas:*', 'proformas:all', 'query:proformas:*', 'facturas:*', 'query:facturas:*'],
            'abonos': ['abonos:*', 'abonos:all', 'query:abonos:*', 'facturas:*', 'query:facturas:*'],
            'empresas': ['empresas:*', 'empresas:all', 'query:empresas:*']
        };

        if (patterns[table]) {
            let totalDeleted = 0;
            patterns[table].forEach(pattern => {
                totalDeleted += this.invalidatePattern(pattern);
            });
            if (totalDeleted > 0) {
                console.log(`🗑️ Cache invalidated for ${operation} on ${table} (${totalDeleted} total keys)`);
            }
        }
    }

    /**
     * Verifica y corrige inconsistencias en el caché
     * @param {string} key - Clave del caché a verificar
     * @param {Function} dbCheckFunction - Función que verifica el estado real en la BD
     */
    async verifyAndCorrect(key, dbCheckFunction) {
        const cachedValue = this.get(key);
        
        try {
            const dbValue = await dbCheckFunction();
            
            // Si el caché tiene datos pero la BD está vacía, limpiar caché
            if (cachedValue && cachedValue.length > 0 && (!dbValue || dbValue.length === 0)) {
                console.log(`⚠️ Inconsistencia detectada: caché tiene datos pero BD está vacía para ${key}`);
                this.del(key);
                return null;
            }
            
            // Si el caché está vacío pero la BD tiene datos, actualizar caché
            if ((!cachedValue || cachedValue.length === 0) && dbValue && dbValue.length > 0) {
                console.log(`⚠️ Inconsistencia detectada: BD tiene datos pero caché está vacío para ${key}`);
                this.set(key, dbValue);
                return dbValue;
            }
            
            return cachedValue;
        } catch (error) {
            console.error(`Error verificando consistencia para ${key}:`, error);
            return cachedValue;
        }
    }

    /**
     * Obtiene o establece un valor con función de callback
     */
    async getOrSet(key, fetchFunction, ttl = null) {
        let value = this.get(key);
        
        if (value === null) {
            try {
                value = await fetchFunction();
                this.set(key, value, ttl);
            } catch (error) {
                console.error(`❌ Error al obtener datos para caché ${key}:`, error);
                throw error;
            }
        }
        
        return value;
    }

    /**
     * Invalida caché relacionado con una entidad
     */
    invalidateEntity(entityType, entityId = null) {
        const patterns = [
            `${entityType}:*`,
            `list:${entityType}:*`,
            `count:${entityType}:*`
        ];
        
        if (entityId) {
            patterns.push(`${entityType}:${entityId}:*`);
        }
        
        let totalDeleted = 0;
        patterns.forEach(pattern => {
            totalDeleted += this.delPattern(pattern);
        });
        
        console.log(`🔄 Cache invalidated for ${entityType}${entityId ? `:${entityId}` : ''} (${totalDeleted} keys)`);
        return totalDeleted;
    }

    /**
     * Precalienta el caché con datos frecuentes
     */
    async preheat(fetchFunctions) {
        console.log('🔥 Precalentando caché...');
        
        for (const [key, fetchFunction] of Object.entries(fetchFunctions)) {
            try {
                const value = await fetchFunction();
                this.set(key, value);
                console.log(`✅ Precalentado: ${key}`);
            } catch (error) {
                console.error(`❌ Error precalentando ${key}:`, error);
            }
        }
        
        console.log('🔥 Precalentamiento completado');
    }
}

// Sistema de caché específico para base de datos
class DatabaseCacheManager extends CacheManager {
    constructor(config) {
        super(config);
        this.queryCache = new Map();
        this.setupQueryCache();
    }

    /**
     * Configura el caché de consultas
     */
    setupQueryCache() {
        // Caché para consultas frecuentes
        this.queryCache.set('empresas:all', { ttl: 3600, key: 'empresas:all' });
        this.queryCache.set('productos:all', { ttl: 1800, key: 'productos:all' });
        this.queryCache.set('clientes:all', { ttl: 1800, key: 'clientes:all' });
        this.queryCache.set('coches:all', { ttl: 1800, key: 'coches:all' });
        this.queryCache.set('facturas:count', { ttl: 300, key: 'facturas:count' });
    }

    /**
     * Ejecuta una consulta con caché
     */
    async executeCachedQuery(queryKey, queryFunction, ttl = null) {
        const cacheKey = `query:${queryKey}`;
        
        return await this.getOrSet(cacheKey, queryFunction, ttl);
    }

    /**
     * Invalida caché de consultas relacionadas
     */
    invalidateQueryCache(entityType) {
        const patterns = [
            `query:${entityType}:*`,
            `query:list:${entityType}:*`,
            `query:count:${entityType}:*`
        ];
        
        let totalDeleted = 0;
        patterns.forEach(pattern => {
            totalDeleted += this.delPattern(pattern);
        });
        
        return totalDeleted;
    }
}

// Sistema de caché para archivos
class FileCacheManager extends CacheManager {
    constructor(config) {
        super(config);
        this.fileCache = new Map();
        this.setupFileWatchers();
    }

    /**
     * Configura watchers para archivos
     */
    setupFileWatchers() {
        // Watcher para archivos de configuración
        const configFiles = [
            path.join(__dirname, 'config.json'),
            path.join(__dirname, '..', 'package.json')
        ];
        
        configFiles.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                fs.watchFile(filePath, (curr, prev) => {
                    if (curr.mtime !== prev.mtime) {
                        this.invalidateFileCache(filePath);
                    }
                });
            }
        });
    }

    /**
     * Obtiene contenido de archivo con caché
     */
    async getFileContent(filePath, encoding = 'utf8') {
        const cacheKey = `file:${filePath}`;
        
        return await this.getOrSet(cacheKey, async () => {
            return fs.readFileSync(filePath, encoding);
        }, 300); // 5 minutos TTL
    }

    /**
     * Invalida caché de archivo
     */
    invalidateFileCache(filePath) {
        const cacheKey = `file:${filePath}`;
        this.del(cacheKey);
        console.log(`🔄 File cache invalidated: ${filePath}`);
    }
}

// Factory para crear instancias de caché
class CacheFactory {
    static createCacheManager(type, config) {
        switch (type) {
            case 'database':
                return new DatabaseCacheManager(config);
            case 'file':
                return new FileCacheManager(config);
            default:
                return new CacheManager(config);
        }
    }
}

module.exports = {
    CacheManager,
    DatabaseCacheManager,
    FileCacheManager,
    CacheFactory
};

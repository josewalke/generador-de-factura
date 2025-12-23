/**
 * Helper para obtener valores según el tipo de base de datos
 * Elimina la duplicación de código para determinar valores según PostgreSQL o SQLite
 */

const AppConstants = require('../constants/appConstants');

class DbTypeHelper {
    /**
     * Obtiene el valor de activo según el tipo de base de datos
     * @param {string} dbType - Tipo de base de datos ('postgresql' o 'sqlite')
     * @param {boolean} activo - Si es true o false
     * @returns {boolean|number} true/false para PostgreSQL, 1/0 para SQLite
     */
    static getActivoValue(dbType, activo = true) {
        if (dbType === AppConstants.DATABASE.POSTGRESQL) {
            return activo ? AppConstants.ACTIVO.TRUE : AppConstants.ACTIVO.FALSE;
        } else {
            return activo ? AppConstants.ACTIVO.SQLITE_TRUE : AppConstants.ACTIVO.SQLITE_FALSE;
        }
    }

    /**
     * Obtiene el operador LIKE según el tipo de base de datos
     * @param {string} dbType - Tipo de base de datos
     * @returns {string} 'ILIKE' para PostgreSQL, 'LIKE' para SQLite
     */
    static getLikeOperator(dbType) {
        return dbType === AppConstants.DATABASE.POSTGRESQL ? 'ILIKE' : 'LIKE';
    }

    /**
     * Obtiene el tipo de base de datos desde la configuración
     * @param {Object} config - Objeto de configuración
     * @returns {string} Tipo de base de datos
     */
    static getDbType(config) {
        return config.get('database.type') || AppConstants.DATABASE.DEFAULT_TYPE;
    }
}

module.exports = DbTypeHelper;








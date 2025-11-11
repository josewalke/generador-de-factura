// Adaptador SQL para convertir queries de SQLite a PostgreSQL

class SQLAdapter {
    /**
     * Adaptar query CREATE TABLE de SQLite a PostgreSQL
     */
    static adaptCreateTable(query) {
        // Reemplazar tipos de datos
        let adapted = query
            // INTEGER PRIMARY KEY AUTOINCREMENT -> SERIAL PRIMARY KEY
            .replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
            // INTEGER PRIMARY KEY -> SERIAL PRIMARY KEY (sin AUTOINCREMENT)
            .replace(/INTEGER\s+PRIMARY\s+KEY(?!\s+AUTOINCREMENT)/gi, 'SERIAL PRIMARY KEY')
            // AUTOINCREMENT -> (eliminar, ya está en SERIAL)
            .replace(/\s+AUTOINCREMENT/gi, '')
            // DATETIME -> TIMESTAMP
            .replace(/DATETIME/gi, 'TIMESTAMP')
            // DEFAULT CURRENT_TIMESTAMP
            .replace(/DEFAULT\s+CURRENT_TIMESTAMP/gi, 'DEFAULT CURRENT_TIMESTAMP')
            // BOOLEAN -> BOOLEAN (PostgreSQL lo acepta, pero asegurar)
            .replace(/BOOLEAN/gi, 'BOOLEAN')
            // REAL -> NUMERIC para mayor precisión
            .replace(/\bREAL\b/gi, 'NUMERIC')
            // TEXT -> TEXT (PostgreSQL lo acepta)
            .replace(/\bTEXT\b/gi, 'TEXT')
            // INTEGER -> INTEGER (PostgreSQL lo acepta)
            .replace(/\bINTEGER\b/gi, 'INTEGER');

        // Reemplazar IF NOT EXISTS (PostgreSQL lo acepta)
        adapted = adapted.replace(/CREATE TABLE IF NOT EXISTS/gi, 'CREATE TABLE IF NOT EXISTS');

        return adapted;
    }

    /**
     * Adaptar query INSERT para PostgreSQL
     */
    static adaptInsert(query) {
        // PostgreSQL acepta la sintaxis estándar de SQLite
        // Solo necesitamos asegurar que los valores por defecto funcionen
        return query;
    }

    /**
     * Adaptar query SELECT para PostgreSQL
     */
    static adaptSelect(query) {
        // PostgreSQL acepta la sintaxis estándar
        return query;
    }

    /**
     * Adaptar query UPDATE para PostgreSQL
     */
    static adaptUpdate(query) {
        return query;
    }

    /**
     * Adaptar query DELETE para PostgreSQL
     */
    static adaptDelete(query) {
        return query;
    }

    /**
     * Adaptar query genérica
     */
    static adapt(query) {
        const upperQuery = query.toUpperCase().trim();
        
        if (upperQuery.startsWith('CREATE TABLE')) {
            return this.adaptCreateTable(query);
        } else if (upperQuery.startsWith('INSERT')) {
            return this.adaptInsert(query);
        } else if (upperQuery.startsWith('SELECT')) {
            return this.adaptSelect(query);
        } else if (upperQuery.startsWith('UPDATE')) {
            return this.adaptUpdate(query);
        } else if (upperQuery.startsWith('DELETE')) {
            return this.adaptDelete(query);
        }
        
        return query;
    }

    /**
     * Convertir parámetros de SQLite a PostgreSQL si es necesario
     */
    static adaptParams(params) {
        // PostgreSQL usa $1, $2, $3 en lugar de ?
        // Pero pg acepta ? si se configura correctamente
        // Por ahora mantenemos ? y pg lo manejará
        return params;
    }
}

module.exports = SQLAdapter;


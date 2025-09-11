const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Sistema de Backup Automático para cumplir con la Ley Antifraude
 * Realiza copias de seguridad programadas de la base de datos
 */
class SistemaBackup {
    constructor(database, config = {}) {
        this.db = database;
        this.config = {
            directorioBackup: config.directorioBackup || './backups',
            frecuenciaBackup: config.frecuenciaBackup || 24 * 60 * 60 * 1000, // 24 horas
            retencionDias: config.retencionDias || 1460, // 4 años
            cifrado: config.cifrado || true,
            compresion: config.compresion || true,
            ...config
        };
        
        this.intervaloBackup = null;
        this.inicializarDirectorio();
    }

    /**
     * Inicializa el directorio de backups
     */
    inicializarDirectorio() {
        try {
            if (!fs.existsSync(this.config.directorioBackup)) {
                fs.mkdirSync(this.config.directorioBackup, { recursive: true });
                console.log('✅ Directorio de backup creado:', this.config.directorioBackup);
            }
        } catch (error) {
            console.error('❌ Error al crear directorio de backup:', error);
        }
    }

    /**
     * Inicia el sistema de backup automático
     */
    iniciarBackupAutomatico() {
        try {
            // Realizar backup inmediato
            this.realizarBackup();
            
            // Programar backups automáticos
            this.intervaloBackup = setInterval(() => {
                this.realizarBackup();
            }, this.config.frecuenciaBackup);
            
            console.log('✅ Sistema de backup automático iniciado');
            console.log(`📅 Frecuencia: ${this.config.frecuenciaBackup / (60 * 60 * 1000)} horas`);
            console.log(`🗂️ Directorio: ${this.config.directorioBackup}`);
            
        } catch (error) {
            console.error('❌ Error al iniciar backup automático:', error);
        }
    }

    /**
     * Detiene el sistema de backup automático
     */
    detenerBackupAutomatico() {
        if (this.intervaloBackup) {
            clearInterval(this.intervaloBackup);
            this.intervaloBackup = null;
            console.log('⏹️ Sistema de backup automático detenido');
        }
    }

    /**
     * Realiza un backup completo de la base de datos
     */
    async realizarBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const nombreArchivo = `telwagen_backup_${timestamp}.db`;
            const rutaBackup = path.join(this.config.directorioBackup, nombreArchivo);
            
            console.log('🔄 Iniciando backup de base de datos...');
            
            // Realizar backup de SQLite
            await this.backupSQLite(rutaBackup);
            
            // Generar hash de integridad del backup
            const hashIntegridad = await this.generarHashArchivo(rutaBackup);
            
            // Crear archivo de metadatos
            const metadatos = {
                timestamp: new Date().toISOString(),
                archivo: nombreArchivo,
                hash_integridad: hashIntegridad,
                tamaño: fs.statSync(rutaBackup).size,
                version: '1.0',
                tipo: 'backup_completo'
            };
            
            const archivoMetadatos = rutaBackup.replace('.db', '_metadata.json');
            fs.writeFileSync(archivoMetadatos, JSON.stringify(metadatos, null, 2));
            
            // Limpiar backups antiguos
            await this.limpiarBackupsAntiguos();
            
            console.log('✅ Backup completado:', nombreArchivo);
            console.log('🔐 Hash de integridad:', hashIntegridad);
            
            return {
                archivo: nombreArchivo,
                ruta: rutaBackup,
                hash: hashIntegridad,
                tamaño: metadatos.tamaño,
                timestamp: metadatos.timestamp
            };
            
        } catch (error) {
            console.error('❌ Error al realizar backup:', error);
            throw error;
        }
    }

    /**
     * Realiza backup de la base de datos SQLite
     * @param {string} rutaDestino - Ruta donde guardar el backup
     */
    async backupSQLite(rutaDestino) {
        return new Promise((resolve, reject) => {
            // SQLite no tiene un método directo de backup, usamos copia de archivo
            const rutaOriginal = path.join(__dirname, '..', 'database', 'telwagen.db');
            
            try {
                fs.copyFileSync(rutaOriginal, rutaDestino);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Genera hash de integridad de un archivo
     * @param {string} rutaArchivo - Ruta del archivo
     * @returns {string} Hash SHA-256 del archivo
     */
    async generarHashArchivo(rutaArchivo) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(rutaArchivo);
            
            stream.on('data', (data) => {
                hash.update(data);
            });
            
            stream.on('end', () => {
                resolve(hash.digest('hex'));
            });
            
            stream.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Verifica la integridad de un backup
     * @param {string} rutaArchivo - Ruta del archivo de backup
     * @returns {boolean} True si la integridad es válida
     */
    async verificarIntegridadBackup(rutaArchivo) {
        try {
            const archivoMetadatos = rutaArchivo.replace('.db', '_metadata.json');
            
            if (!fs.existsSync(archivoMetadatos)) {
                console.warn('⚠️ Archivo de metadatos no encontrado');
                return false;
            }
            
            const metadatos = JSON.parse(fs.readFileSync(archivoMetadatos, 'utf8'));
            const hashActual = await this.generarHashArchivo(rutaArchivo);
            
            return hashActual === metadatos.hash_integridad;
            
        } catch (error) {
            console.error('❌ Error al verificar integridad del backup:', error);
            return false;
        }
    }

    /**
     * Limpia backups antiguos según la política de retención
     */
    async limpiarBackupsAntiguos() {
        try {
            const archivos = fs.readdirSync(this.config.directorioBackup);
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - this.config.retencionDias);
            
            let archivosEliminados = 0;
            
            for (const archivo of archivos) {
                if (archivo.startsWith('telwagen_backup_') && archivo.endsWith('.db')) {
                    const rutaArchivo = path.join(this.config.directorioBackup, archivo);
                    const stats = fs.statSync(rutaArchivo);
                    
                    if (stats.mtime < fechaLimite) {
                        fs.unlinkSync(rutaArchivo);
                        
                        // Eliminar también el archivo de metadatos
                        const archivoMetadatos = rutaArchivo.replace('.db', '_metadata.json');
                        if (fs.existsSync(archivoMetadatos)) {
                            fs.unlinkSync(archivoMetadatos);
                        }
                        
                        archivosEliminados++;
                        console.log('🗑️ Backup antiguo eliminado:', archivo);
                    }
                }
            }
            
            if (archivosEliminados > 0) {
                console.log(`✅ ${archivosEliminados} backups antiguos eliminados`);
            }
            
        } catch (error) {
            console.error('❌ Error al limpiar backups antiguos:', error);
        }
    }

    /**
     * Lista todos los backups disponibles
     * @returns {Array} Lista de backups con metadatos
     */
    listarBackups() {
        try {
            const archivos = fs.readdirSync(this.config.directorioBackup);
            const backups = [];
            
            for (const archivo of archivos) {
                if (archivo.startsWith('telwagen_backup_') && archivo.endsWith('.db')) {
                    const rutaArchivo = path.join(this.config.directorioBackup, archivo);
                    const archivoMetadatos = rutaArchivo.replace('.db', '_metadata.json');
                    
                    if (fs.existsSync(archivoMetadatos)) {
                        const metadatos = JSON.parse(fs.readFileSync(archivoMetadatos, 'utf8'));
                        const stats = fs.statSync(rutaArchivo);
                        
                        backups.push({
                            archivo: archivo,
                            ruta: rutaArchivo,
                            timestamp: metadatos.timestamp,
                            hash: metadatos.hash_integridad,
                            tamaño: metadatos.tamaño,
                            fechaModificacion: stats.mtime
                        });
                    }
                }
            }
            
            return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
        } catch (error) {
            console.error('❌ Error al listar backups:', error);
            return [];
        }
    }

    /**
     * Restaura la base de datos desde un backup
     * @param {string} archivoBackup - Nombre del archivo de backup
     * @returns {boolean} True si la restauración fue exitosa
     */
    async restaurarBackup(archivoBackup) {
        try {
            const rutaBackup = path.join(this.config.directorioBackup, archivoBackup);
            
            if (!fs.existsSync(rutaBackup)) {
                throw new Error('Archivo de backup no encontrado');
            }
            
            // Verificar integridad del backup
            const integridadValida = await this.verificarIntegridadBackup(rutaBackup);
            if (!integridadValida) {
                throw new Error('El backup ha sido alterado o está corrupto');
            }
            
            // Realizar backup de la base de datos actual antes de restaurar
            const backupActual = await this.realizarBackup();
            console.log('💾 Backup de seguridad creado antes de restaurar:', backupActual.archivo);
            
            // Restaurar la base de datos
            const rutaOriginal = path.join(__dirname, '..', 'database', 'telwagen.db');
            fs.copyFileSync(rutaBackup, rutaOriginal);
            
            console.log('✅ Base de datos restaurada desde:', archivoBackup);
            return true;
            
        } catch (error) {
            console.error('❌ Error al restaurar backup:', error);
            throw error;
        }
    }
}

module.exports = SistemaBackup;

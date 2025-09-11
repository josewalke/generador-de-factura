const crypto = require('crypto');

/**
 * Módulo de Auditoría Automática para cumplir con la Ley Antifraude
 * Registra automáticamente todas las operaciones en la base de datos
 */
class SistemaAuditoria {
    constructor(database) {
        this.db = database;
        this.sistemaIntegridad = require('./sistemaIntegridad');
    }

    /**
     * Registra una operación en el log de auditoría
     * @param {string} tabla - Nombre de la tabla afectada
     * @param {number} registroId - ID del registro afectado
     * @param {string} operacion - Tipo de operación (INSERT, UPDATE, DELETE)
     * @param {Object} datosAnteriores - Datos anteriores (para UPDATE/DELETE)
     * @param {Object} datosNuevos - Datos nuevos (para INSERT/UPDATE)
     * @param {string} usuario - Usuario que realiza la operación
     * @param {string} ipAddress - Dirección IP
     * @param {string} userAgent - User Agent del cliente
     */
    async registrarOperacion(tabla, registroId, operacion, datosAnteriores = null, datosNuevos = null, usuario = 'sistema', ipAddress = '127.0.0.1', userAgent = 'sistema') {
        try {
            // Generar hash de integridad para los datos
            const datosParaHash = {
                tabla,
                registroId,
                operacion,
                datosAnteriores,
                datosNuevos,
                timestamp: new Date().toISOString()
            };
            
            const hashIntegridad = this.sistemaIntegridad.generarHashIntegridad(datosParaHash);
            
            // Insertar en el log de auditoría
            const query = `
                INSERT INTO audit_log (
                    tabla_afectada, registro_id, operacion, usuario,
                    datos_anteriores, datos_nuevos, hash_integridad,
                    ip_address, user_agent
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                tabla,
                registroId,
                operacion,
                usuario,
                datosAnteriores ? JSON.stringify(datosAnteriores) : null,
                datosNuevos ? JSON.stringify(datosNuevos) : null,
                hashIntegridad,
                ipAddress,
                userAgent
            ];
            
            return new Promise((resolve, reject) => {
                this.db.run(query, params, function(err) {
                    if (err) {
                        console.error('❌ Error al registrar operación de auditoría:', err);
                        reject(err);
                    } else {
                        console.log(`✅ Operación de auditoría registrada: ${operacion} en ${tabla} (ID: ${registroId})`);
                        resolve(this.lastID);
                    }
                });
            });
        } catch (error) {
            console.error('❌ Error en sistema de auditoría:', error);
            throw error;
        }
    }

    /**
     * Registra la creación de una factura
     * @param {Object} datosFactura - Datos de la factura creada
     * @param {string} usuario - Usuario que crea la factura
     */
    async registrarCreacionFactura(datosFactura, usuario = 'sistema') {
        try {
            // Generar sellado temporal
            const selladoTemporal = this.sistemaIntegridad.generarSelladoTemporal(datosFactura);
            
            // Registrar en auditoría
            await this.registrarOperacion(
                'facturas',
                datosFactura.id,
                'INSERT',
                null,
                datosFactura,
                usuario
            );
            
            // Registrar sellado temporal
            await this.registrarSelladoTemporal(datosFactura.id, selladoTemporal);
            
            return selladoTemporal;
        } catch (error) {
            console.error('❌ Error al registrar creación de factura:', error);
            throw error;
        }
    }

    /**
     * Registra la modificación de una factura
     * @param {number} facturaId - ID de la factura
     * @param {Object} datosAnteriores - Datos anteriores
     * @param {Object} datosNuevos - Datos nuevos
     * @param {string} usuario - Usuario que modifica
     */
    async registrarModificacionFactura(facturaId, datosAnteriores, datosNuevos, usuario = 'sistema') {
        try {
            // Verificar integridad de datos anteriores
            if (datosAnteriores.hash_documento) {
                const integridadValida = this.sistemaIntegridad.verificarIntegridad(datosAnteriores, datosAnteriores.hash_documento);
                if (!integridadValida) {
                    throw new Error('Los datos anteriores han sido alterados');
                }
            }
            
            // Generar nuevo sellado temporal
            const selladoTemporal = this.sistemaIntegridad.generarSelladoTemporal(datosNuevos);
            
            // Registrar en auditoría
            await this.registrarOperacion(
                'facturas',
                facturaId,
                'UPDATE',
                datosAnteriores,
                datosNuevos,
                usuario
            );
            
            // Registrar nuevo sellado temporal
            await this.registrarSelladoTemporal(facturaId, selladoTemporal);
            
            return selladoTemporal;
        } catch (error) {
            console.error('❌ Error al registrar modificación de factura:', error);
            throw error;
        }
    }

    /**
     * Registra el sellado temporal de un documento
     * @param {number} documentoId - ID del documento
     * @param {Object} selladoTemporal - Datos del sellado temporal
     */
    async registrarSelladoTemporal(documentoId, selladoTemporal) {
        try {
            const query = `
                INSERT INTO sellados_temporales (
                    documento_id, tipo_documento, timestamp, hash_sellado, hash_documento
                ) VALUES (?, ?, ?, ?, ?)
            `;
            
            const params = [
                documentoId,
                'factura',
                selladoTemporal.timestamp,
                selladoTemporal.hash_sellado,
                selladoTemporal.hash_documento
            ];
            
            return new Promise((resolve, reject) => {
                this.db.run(query, params, function(err) {
                    if (err) {
                        console.error('❌ Error al registrar sellado temporal:', err);
                        reject(err);
                    } else {
                        console.log(`✅ Sellado temporal registrado para documento ${documentoId}`);
                        resolve(this.lastID);
                    }
                });
            });
        } catch (error) {
            console.error('❌ Error al registrar sellado temporal:', error);
            throw error;
        }
    }

    /**
     * Obtiene el historial de auditoría de un documento
     * @param {string} tabla - Nombre de la tabla
     * @param {number} registroId - ID del registro
     * @returns {Array} Historial de auditoría
     */
    async obtenerHistorialAuditoria(tabla, registroId) {
        try {
            const query = `
                SELECT * FROM audit_log 
                WHERE tabla_afectada = ? AND registro_id = ?
                ORDER BY timestamp DESC
            `;
            
            return new Promise((resolve, reject) => {
                this.db.all(query, [tabla, registroId], (err, rows) => {
                    if (err) {
                        console.error('❌ Error al obtener historial de auditoría:', err);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        } catch (error) {
            console.error('❌ Error al obtener historial de auditoría:', error);
            throw error;
        }
    }

    /**
     * Verifica la integridad de todos los registros de auditoría
     * @returns {Object} Resultado de la verificación
     */
    async verificarIntegridadAuditoria() {
        try {
            const query = `
                SELECT * FROM audit_log 
                ORDER BY timestamp DESC
            `;
            
            return new Promise((resolve, reject) => {
                this.db.all(query, [], (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    let registrosVerificados = 0;
                    let registrosAlterados = 0;
                    
                    rows.forEach(row => {
                        const datosParaVerificar = {
                            tabla: row.tabla_afectada,
                            registroId: row.registro_id,
                            operacion: row.operacion,
                            datosAnteriores: row.datos_anteriores ? JSON.parse(row.datos_anteriores) : null,
                            datosNuevos: row.datos_nuevos ? JSON.parse(row.datos_nuevos) : null,
                            timestamp: row.timestamp
                        };
                        
                        const integridadValida = this.sistemaIntegridad.verificarIntegridad(datosParaVerificar, row.hash_integridad);
                        
                        if (integridadValida) {
                            registrosVerificados++;
                        } else {
                            registrosAlterados++;
                        }
                    });
                    
                    resolve({
                        total: rows.length,
                        verificados: registrosVerificados,
                        alterados: registrosAlterados,
                        integridad: registrosAlterados === 0
                    });
                });
            });
        } catch (error) {
            console.error('❌ Error al verificar integridad de auditoría:', error);
            throw error;
        }
    }
}

module.exports = SistemaAuditoria;

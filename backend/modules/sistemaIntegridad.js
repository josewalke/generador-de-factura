const crypto = require('crypto');

/**
 * Módulo para cumplir con la Ley Antifraude - Sistema de Integridad
 * Genera hash de integridad y sellado temporal para documentos fiscales
 */
class SistemaIntegridad {
    constructor() {
        this.algoritmoHash = 'sha256';
        this.algoritmoCifrado = 'aes-256-gcm';
    }

    /**
     * Genera hash de integridad para un documento
     * @param {Object} datosDocumento - Datos del documento a hashear
     * @returns {string} Hash SHA-256 del documento
     */
    generarHashIntegridad(datosDocumento) {
        try {
            // Convertir objeto a string JSON ordenado para consistencia
            const datosOrdenados = this.ordenarObjeto(datosDocumento);
            const datosString = JSON.stringify(datosOrdenados);
            
            // Generar hash SHA-256
            const hash = crypto.createHash(this.algoritmoHash);
            hash.update(datosString, 'utf8');
            
            return hash.digest('hex');
        } catch (error) {
            console.error('❌ Error al generar hash de integridad:', error);
            throw new Error('Error al generar hash de integridad');
        }
    }

    /**
     * Genera sellado temporal criptográfico
     * @param {Object} datosDocumento - Datos del documento
     * @returns {Object} Objeto con timestamp y hash del timestamp
     */
    generarSelladoTemporal(datosDocumento) {
        try {
            const timestamp = new Date().toISOString();
            const hashDocumento = this.generarHashIntegridad(datosDocumento);
            
            // Crear hash del timestamp + hash del documento
            const datosSellado = {
                timestamp: timestamp,
                hash_documento: hashDocumento,
                version: '1.0'
            };
            
            const hashSellado = crypto.createHash(this.algoritmoHash);
            hashSellado.update(JSON.stringify(datosSellado), 'utf8');
            
            return {
                timestamp: timestamp,
                hash_sellado: hashSellado.digest('hex'),
                hash_documento: hashDocumento
            };
        } catch (error) {
            console.error('❌ Error al generar sellado temporal:', error);
            throw new Error('Error al generar sellado temporal');
        }
    }

    /**
     * Verifica la integridad de un documento
     * @param {Object} datosDocumento - Datos del documento
     * @param {string} hashOriginal - Hash original del documento
     * @returns {boolean} True si la integridad es válida
     */
    verificarIntegridad(datosDocumento, hashOriginal) {
        try {
            const hashActual = this.generarHashIntegridad(datosDocumento);
            return hashActual === hashOriginal;
        } catch (error) {
            console.error('❌ Error al verificar integridad:', error);
            return false;
        }
    }

    /**
     * Genera número de serie único para facturas
     * @param {number} empresaId - ID de la empresa
     * @param {string} numeroFactura - Número de factura
     * @returns {string} Número de serie único
     */
    generarNumeroSerie(empresaId, numeroFactura) {
        try {
            const datosSerie = {
                empresa_id: empresaId,
                numero_factura: numeroFactura,
                timestamp: new Date().toISOString()
            };
            
            const hashSerie = crypto.createHash(this.algoritmoHash);
            hashSerie.update(JSON.stringify(datosSerie), 'utf8');
            
            // Tomar los primeros 8 caracteres del hash como número de serie
            return hashSerie.digest('hex').substring(0, 8).toUpperCase();
        } catch (error) {
            console.error('❌ Error al generar número de serie:', error);
            throw new Error('Error al generar número de serie');
        }
    }

    /**
     * Ordena un objeto recursivamente para consistencia en el hash
     * @param {Object} obj - Objeto a ordenar
     * @returns {Object} Objeto ordenado
     */
    ordenarObjeto(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.ordenarObjeto(item));
        }
        
        const ordenado = {};
        Object.keys(obj).sort().forEach(key => {
            ordenado[key] = this.ordenarObjeto(obj[key]);
        });
        
        return ordenado;
    }

    /**
     * Genera código VeriFactu para envío a AEAT
     * @param {Object} datosFactura - Datos completos de la factura
     * @returns {string} Código VeriFactu
     */
    generarCodigoVeriFactu(datosFactura) {
        try {
            const datosVeriFactu = {
                numero_factura: datosFactura.numero_factura,
                numero_serie: datosFactura.numero_serie,
                empresa_cif: datosFactura.empresa_cif,
                cliente_identificacion: datosFactura.cliente_identificacion,
                fecha_emision: datosFactura.fecha_emision,
                total: datosFactura.total,
                timestamp: new Date().toISOString()
            };
            
            const hashVeriFactu = crypto.createHash(this.algoritmoHash);
            hashVeriFactu.update(JSON.stringify(datosVeriFactu), 'utf8');
            
            return 'VF-' + hashVeriFactu.digest('hex').substring(0, 12).toUpperCase();
        } catch (error) {
            console.error('❌ Error al generar código VeriFactu:', error);
            throw new Error('Error al generar código VeriFactu');
        }
    }
}

module.exports = SistemaIntegridad;

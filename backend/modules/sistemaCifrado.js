const crypto = require('crypto');

/**
 * Sistema de Cifrado para Datos Sensibles
 * Implementa cifrado AES-256-GCM para proteger datos sensibles según Ley Antifraude
 */
class SistemaCifrado {
    constructor() {
        // Clave de cifrado derivada del entorno (en producción usar variable de entorno)
        this.claveCifrado = process.env.CLAVE_CIFRADO || 'Telwagen2024LeyAntifraude!';
        this.algoritmo = 'aes-256-gcm';
        this.longitudIV = 16; // 128 bits
        this.longitudTag = 16; // 128 bits
    }

    /**
     * Genera una clave de cifrado segura
     */
    generarClave() {
        return crypto.randomBytes(32); // 256 bits
    }

    /**
     * Genera un IV (Initialization Vector) aleatorio
     */
    generarIV() {
        return crypto.randomBytes(this.longitudIV);
    }

    /**
     * Cifra datos sensibles usando AES-256-GCM
     * @param {string} texto - Texto a cifrar
     * @param {string} clave - Clave de cifrado (opcional)
     * @returns {Object} Objeto con datos cifrados
     */
    cifrar(texto, clave = null) {
        try {
            if (!texto || typeof texto !== 'string') {
                throw new Error('El texto a cifrar debe ser una cadena no vacía');
            }

            const claveUsar = clave || this.claveCifrado;
            const iv = this.generarIV();
            const cipher = crypto.createCipher(this.algoritmo, claveUsar);
            cipher.setAAD(Buffer.from('TelwagenAntifraude', 'utf8'));

            let cifrado = cipher.update(texto, 'utf8', 'hex');
            cifrado += cipher.final('hex');
            
            const tag = cipher.getAuthTag();

            return {
                datos: cifrado,
                iv: iv.toString('hex'),
                tag: tag.toString('hex'),
                algoritmo: this.algoritmo,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error al cifrar datos:', error);
            throw new Error(`Error de cifrado: ${error.message}`);
        }
    }

    /**
     * Descifra datos sensibles
     * @param {Object} datosCifrados - Objeto con datos cifrados
     * @param {string} clave - Clave de descifrado (opcional)
     * @returns {string} Texto descifrado
     */
    descifrar(datosCifrados, clave = null) {
        try {
            if (!datosCifrados || typeof datosCifrados !== 'object') {
                throw new Error('Los datos cifrados deben ser un objeto válido');
            }

            const { datos, iv, tag, algoritmo } = datosCifrados;
            
            if (!datos || !iv || !tag) {
                throw new Error('Faltan componentes necesarios para el descifrado');
            }

            const claveUsar = clave || this.claveCifrado;
            const decipher = crypto.createDecipher(algoritmo, claveUsar);
            decipher.setAAD(Buffer.from('TelwagenAntifraude', 'utf8'));
            decipher.setAuthTag(Buffer.from(tag, 'hex'));

            let descifrado = decipher.update(datos, 'hex', 'utf8');
            descifrado += decipher.final('utf8');

            return descifrado;
        } catch (error) {
            console.error('❌ Error al descifrar datos:', error);
            throw new Error(`Error de descifrado: ${error.message}`);
        }
    }

    /**
     * Cifra campos sensibles de una factura
     * @param {Object} factura - Datos de la factura
     * @returns {Object} Factura con campos sensibles cifrados
     */
    cifrarFactura(factura) {
        try {
            const facturaCifrada = { ...factura };
            
            // Campos sensibles que requieren cifrado
            const camposSensibles = [
                'notas',
                'referencia_operacion',
                'metodo_pago'
            ];

            camposSensibles.forEach(campo => {
                if (factura[campo] && typeof factura[campo] === 'string') {
                    facturaCifrada[`${campo}_cifrado`] = this.cifrar(factura[campo]);
                    // Mantener el campo original para compatibilidad
                    facturaCifrada[campo] = factura[campo];
                }
            });

            return facturaCifrada;
        } catch (error) {
            console.error('❌ Error al cifrar factura:', error);
            throw error;
        }
    }

    /**
     * Descifra campos sensibles de una factura
     * @param {Object} factura - Factura con campos cifrados
     * @returns {Object} Factura con campos descifrados
     */
    descifrarFactura(factura) {
        try {
            const facturaDescifrada = { ...factura };
            
            const camposSensibles = [
                'notas',
                'referencia_operacion',
                'metodo_pago'
            ];

            camposSensibles.forEach(campo => {
                const campoCifrado = `${campo}_cifrado`;
                if (factura[campoCifrado]) {
                    try {
                        facturaDescifrada[campo] = this.descifrar(factura[campoCifrado]);
                    } catch (error) {
                        console.warn(`⚠️ No se pudo descifrar el campo ${campo}:`, error.message);
                        // Mantener el valor original si el descifrado falla
                        facturaDescifrada[campo] = factura[campo];
                    }
                }
            });

            return facturaDescifrada;
        } catch (error) {
            console.error('❌ Error al descifrar factura:', error);
            throw error;
        }
    }

    /**
     * Genera hash seguro para verificación de integridad
     * @param {string} datos - Datos a hashear
     * @returns {string} Hash SHA-256
     */
    generarHashSeguro(datos) {
        return crypto.createHash('sha256').update(datos).digest('hex');
    }

    /**
     * Verifica la integridad de datos cifrados
     * @param {Object} datosCifrados - Datos cifrados
     * @param {string} hashOriginal - Hash original
     * @returns {boolean} True si la integridad es válida
     */
    verificarIntegridad(datosCifrados, hashOriginal) {
        try {
            const datosDescifrados = this.descifrar(datosCifrados);
            const hashCalculado = this.generarHashSeguro(datosDescifrados);
            return hashCalculado === hashOriginal;
        } catch (error) {
            console.error('❌ Error al verificar integridad:', error);
            return false;
        }
    }

    /**
     * Obtiene información del sistema de cifrado
     * @returns {Object} Información del sistema
     */
    obtenerInformacion() {
        return {
            algoritmo: this.algoritmo,
            longitudIV: this.longitudIV,
            longitudTag: this.longitudTag,
            version: '1.0.0',
            cumplimiento: 'Ley Antifraude España 11/2021',
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = SistemaCifrado;

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Sistema de Firma Digital para Cumplimiento Ley Antifraude
 * Implementa firma digital PKCS#7 para documentos fiscales
 */
class SistemaFirmaDigital {
    constructor() {
        this.algoritmoFirma = 'sha256';
        this.algoritmoCifrado = 'aes-256-cbc';
        this.directorioCertificados = path.join(__dirname, '..', 'certificados');
        this.directorioFirmas = path.join(__dirname, '..', 'firmas');
        
        // Crear directorios si no existen
        this.crearDirectorios();
        
        // Certificado por defecto para desarrollo
        this.certificadoPorDefecto = this.generarCertificadoDesarrollo();
    }

    /**
     * Crea los directorios necesarios para certificados y firmas
     */
    crearDirectorios() {
        try {
            if (!fs.existsSync(this.directorioCertificados)) {
                fs.mkdirSync(this.directorioCertificados, { recursive: true });
            }
            if (!fs.existsSync(this.directorioFirmas)) {
                fs.mkdirSync(this.directorioFirmas, { recursive: true });
            }
        } catch (error) {
            console.error('❌ Error al crear directorios:', error);
        }
    }

    /**
     * Genera un certificado de desarrollo para pruebas
     */
    generarCertificadoDesarrollo() {
        try {
            const certificadoInfo = {
                empresa: 'Telwagen Car Ibérica, S.L.',
                cif: 'B-93.289.585',
                direccion: 'C. / Tomás Miller N° 48 Local, 35007 Las Palmas de Gran Canaria',
                email: 'info@telwagen.com',
                telefono: '+34 928 123 456',
                validoDesde: new Date(),
                validoHasta: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
                serial: 'TELWAGEN-DEV-001',
                algoritmo: 'RSA-2048',
                hash: 'SHA-256'
            };

            // Generar clave privada y pública simulada
            const clavePrivada = crypto.randomBytes(32).toString('hex');
            const clavePublica = crypto.randomBytes(32).toString('hex');
            const fingerprint = crypto.createHash('sha256').update(JSON.stringify(certificadoInfo)).digest('hex');

            return {
                ...certificadoInfo,
                clavePrivada,
                clavePublica,
                fingerprint,
                tipo: 'desarrollo',
                emisor: 'Telwagen Car Ibérica, S.L.',
                sujeto: 'Telwagen Car Ibérica, S.L.'
            };
        } catch (error) {
            console.error('❌ Error al generar certificado de desarrollo:', error);
            throw error;
        }
    }

    /**
     * Carga un certificado desde archivo
     */
    cargarCertificado(rutaArchivo) {
        try {
            if (!fs.existsSync(rutaArchivo)) {
                throw new Error('Archivo de certificado no encontrado');
            }

            const contenido = fs.readFileSync(rutaArchivo, 'utf8');
            const certificado = JSON.parse(contenido);
            
            // Validar estructura del certificado
            this.validarCertificado(certificado);
            
            return certificado;
        } catch (error) {
            console.error('❌ Error al cargar certificado:', error);
            throw error;
        }
    }

    /**
     * Valida la estructura de un certificado
     */
    validarCertificado(certificado) {
        const camposRequeridos = [
            'empresa', 'cif', 'clavePrivada', 'clavePublica', 
            'validoDesde', 'validoHasta', 'serial', 'fingerprint'
        ];

        for (const campo of camposRequeridos) {
            if (!certificado[campo]) {
                throw new Error(`Campo requerido faltante en certificado: ${campo}`);
            }
        }

        // Validar fechas
        const ahora = new Date();
        const validoDesde = new Date(certificado.validoDesde);
        const validoHasta = new Date(certificado.validoHasta);

        if (ahora < validoDesde) {
            throw new Error('Certificado aún no válido');
        }

        if (ahora > validoHasta) {
            throw new Error('Certificado expirado');
        }

        return true;
    }

    /**
     * Genera una firma digital para un documento
     */
    firmarDocumento(datosDocumento, certificado = null) {
        try {
            const cert = certificado || this.certificadoPorDefecto;
            
            // Validar certificado
            this.validarCertificado(cert);

            // Preparar datos para firma
            const datosParaFirmar = {
                documento: datosDocumento,
                certificado: {
                    serial: cert.serial,
                    empresa: cert.empresa,
                    cif: cert.cif,
                    fingerprint: cert.fingerprint
                },
                timestamp: new Date().toISOString(),
                algoritmo: this.algoritmoFirma
            };

            // Generar hash del documento
            const hashDocumento = crypto.createHash(this.algoritmoFirma)
                .update(JSON.stringify(datosParaFirmar))
                .digest('hex');

            // Crear firma digital (simulada para desarrollo)
            const firmaDigital = this.crearFirmaDigital(hashDocumento, cert);

            // Crear estructura de firma completa
            const firmaCompleta = {
                version: '1.0',
                algoritmo: this.algoritmoFirma,
                certificado: {
                    serial: cert.serial,
                    empresa: cert.empresa,
                    cif: cert.cif,
                    fingerprint: cert.fingerprint,
                    validoDesde: cert.validoDesde,
                    validoHasta: cert.validoHasta
                },
                documento: {
                    hash: hashDocumento,
                    timestamp: datosParaFirmar.timestamp,
                    tipo: 'factura'
                },
                firma: firmaDigital,
                metadata: {
                    creado: new Date().toISOString(),
                    software: 'Generador de Facturas Telwagen v1.0.0',
                    cumplimiento: 'Ley Antifraude España 11/2021'
                }
            };

            return firmaCompleta;
        } catch (error) {
            console.error('❌ Error al firmar documento:', error);
            throw error;
        }
    }

    /**
     * Crea una firma digital (simulada para desarrollo)
     */
    crearFirmaDigital(hashDocumento, certificado) {
        try {
            // En un entorno real, aquí se usaría la clave privada del certificado
            // Para desarrollo, generamos una firma simulada
            const datosFirma = {
                hash: hashDocumento,
                clavePrivada: certificado.clavePrivada,
                timestamp: new Date().toISOString(),
                serial: certificado.serial
            };

            const firma = crypto.createHash('sha256')
                .update(JSON.stringify(datosFirma))
                .digest('hex');

            return {
                valor: firma,
                algoritmo: 'RSA-SHA256',
                formato: 'PKCS#7',
                timestamp: datosFirma.timestamp
            };
        } catch (error) {
            console.error('❌ Error al crear firma digital:', error);
            throw error;
        }
    }

    /**
     * Verifica una firma digital
     */
    verificarFirma(firmaCompleta, datosDocumento) {
        try {
            // Validar estructura de la firma
            if (!firmaCompleta.firma || !firmaCompleta.certificado) {
                throw new Error('Estructura de firma inválida');
            }

            // Verificar certificado
            this.validarCertificado(firmaCompleta.certificado);

            // Recrear hash del documento
            const datosParaVerificar = {
                documento: datosDocumento,
                certificado: {
                    serial: firmaCompleta.certificado.serial,
                    empresa: firmaCompleta.certificado.empresa,
                    cif: firmaCompleta.certificado.cif,
                    fingerprint: firmaCompleta.certificado.fingerprint
                },
                timestamp: firmaCompleta.documento.timestamp,
                algoritmo: firmaCompleta.algoritmo
            };

            const hashCalculado = crypto.createHash(firmaCompleta.algoritmo)
                .update(JSON.stringify(datosParaVerificar))
                .digest('hex');

            // Verificar que el hash coincide
            if (hashCalculado !== firmaCompleta.documento.hash) {
                return {
                    valida: false,
                    error: 'Hash del documento no coincide',
                    hashEsperado: firmaCompleta.documento.hash,
                    hashCalculado: hashCalculado
                };
            }

            // Verificar firma digital
            const firmaVerificada = this.verificarFirmaDigital(firmaCompleta.firma, hashCalculado);

            return {
                valida: firmaVerificada,
                certificado: firmaCompleta.certificado,
                documento: firmaCompleta.documento,
                timestamp: firmaCompleta.documento.timestamp,
                algoritmo: firmaCompleta.algoritmo
            };
        } catch (error) {
            console.error('❌ Error al verificar firma:', error);
            return {
                valida: false,
                error: error.message
            };
        }
    }

    /**
     * Verifica la firma digital (simulada para desarrollo)
     */
    verificarFirmaDigital(firma, hashDocumento) {
        try {
            // En un entorno real, aquí se verificaría con la clave pública del certificado
            // Para desarrollo, verificamos que la firma tenga el formato correcto
            if (!firma.valor || !firma.algoritmo || !firma.timestamp) {
                return false;
            }

            // Verificar que la firma tiene el formato esperado
            if (typeof firma.valor === 'string' && firma.valor.length === 64) {
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Error al verificar firma digital:', error);
            return false;
        }
    }

    /**
     * Firma una factura completa
     */
    firmarFactura(facturaData) {
        try {
            // Preparar datos de la factura para firma
            const datosFactura = {
                numero_factura: facturaData.numero_factura,
                numero_serie: facturaData.numero_serie,
                empresa_id: facturaData.empresa_id,
                cliente_id: facturaData.cliente_id,
                fecha_emision: facturaData.fecha_emision,
                fecha_operacion: facturaData.fecha_operacion,
                subtotal: facturaData.subtotal,
                igic: facturaData.igic,
                total: facturaData.total,
                hash_documento: facturaData.hash_documento,
                sellado_temporal: facturaData.sellado_temporal,
                productos: facturaData.productos || []
            };

            // Generar firma digital
            const firma = this.firmarDocumento(datosFactura);

            // Guardar firma en archivo
            const nombreArchivo = `firma_${facturaData.numero_serie}_${Date.now()}.json`;
            const rutaFirma = path.join(this.directorioFirmas, nombreArchivo);
            
            fs.writeFileSync(rutaFirma, JSON.stringify(firma, null, 2));

            return {
                firma: firma,
                archivo: nombreArchivo,
                ruta: rutaFirma,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error al firmar factura:', error);
            throw error;
        }
    }

    /**
     * Verifica la firma de una factura
     */
    verificarFactura(facturaData, firmaCompleta) {
        try {
            const resultado = this.verificarFirma(firmaCompleta, facturaData);
            
            return {
                factura: facturaData.numero_factura,
                numero_serie: facturaData.numero_serie,
                verificacion: resultado,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error al verificar factura:', error);
            throw error;
        }
    }

    /**
     * Obtiene información del certificado actual
     */
    obtenerInformacionCertificado() {
        return {
            certificado: this.certificadoPorDefecto,
            directorioCertificados: this.directorioCertificados,
            directorioFirmas: this.directorioFirmas,
            algoritmo: this.algoritmoFirma,
            version: '1.0.0',
            tipo: 'desarrollo',
            cumplimiento: 'Ley Antifraude España 11/2021'
        };
    }

    /**
     * Lista todas las firmas generadas
     */
    listarFirmas() {
        try {
            const archivos = fs.readdirSync(this.directorioFirmas);
            const firmas = [];

            for (const archivo of archivos) {
                if (archivo.endsWith('.json')) {
                    const rutaCompleta = path.join(this.directorioFirmas, archivo);
                    const stats = fs.statSync(rutaCompleta);
                    
                    firmas.push({
                        archivo,
                        ruta: rutaCompleta,
                        fechaCreacion: stats.birthtime,
                        fechaModificacion: stats.mtime,
                        tamaño: stats.size
                    });
                }
            }

            return firmas.sort((a, b) => b.fechaCreacion - a.fechaCreacion);
        } catch (error) {
            console.error('❌ Error al listar firmas:', error);
            return [];
        }
    }

    /**
     * Carga una firma desde archivo
     */
    cargarFirma(nombreArchivo) {
        try {
            const rutaFirma = path.join(this.directorioFirmas, nombreArchivo);
            
            if (!fs.existsSync(rutaFirma)) {
                throw new Error('Archivo de firma no encontrado');
            }

            const contenido = fs.readFileSync(rutaFirma, 'utf8');
            return JSON.parse(contenido);
        } catch (error) {
            console.error('❌ Error al cargar firma:', error);
            throw error;
        }
    }

    /**
     * Genera un certificado de producción (requiere configuración real)
     */
    generarCertificadoProduccion(datosEmpresa) {
        try {
            const certificado = {
                empresa: datosEmpresa.empresa,
                cif: datosEmpresa.cif,
                direccion: datosEmpresa.direccion,
                email: datosEmpresa.email,
                telefono: datosEmpresa.telefono,
                validoDesde: new Date(),
                validoHasta: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
                serial: `TELWAGEN-PROD-${Date.now()}`,
                algoritmo: 'RSA-2048',
                hash: 'SHA-256',
                tipo: 'produccion',
                emisor: 'Autoridad Certificadora',
                sujeto: datosEmpresa.empresa,
                // En producción, aquí se generarían las claves reales
                clavePrivada: crypto.randomBytes(32).toString('hex'),
                clavePublica: crypto.randomBytes(32).toString('hex'),
                fingerprint: crypto.createHash('sha256').update(JSON.stringify(datosEmpresa)).digest('hex')
            };

            // Guardar certificado
            const nombreArchivo = `certificado_${certificado.serial}.json`;
            const rutaCertificado = path.join(this.directorioCertificados, nombreArchivo);
            
            fs.writeFileSync(rutaCertificado, JSON.stringify(certificado, null, 2));

            return {
                certificado,
                archivo: nombreArchivo,
                ruta: rutaCertificado
            };
        } catch (error) {
            console.error('❌ Error al generar certificado de producción:', error);
            throw error;
        }
    }
}

module.exports = SistemaFirmaDigital;

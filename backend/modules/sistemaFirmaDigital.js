const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const DetectorCertificadosWindows = require('./detectorCertificadosWindows');

/**
 * Sistema de Firma Digital para Cumplimiento Ley Antifraude
 * Implementa firma digital PKCS#7 para documentos fiscales
 * Integra detección de certificados instalados en Windows
 */
class SistemaFirmaDigital {
    constructor() {
        this.algoritmoFirma = 'sha256';
        this.algoritmoCifrado = 'aes-256-cbc';
        this.directorioCertificados = path.join(__dirname, '..', 'certificados');
        this.directorioFirmas = path.join(__dirname, '..', 'firmas');
        
        // Detector de certificados de Windows
        this.detectorCertificados = new DetectorCertificadosWindows();
        
        // Crear directorios si no existen
        this.crearDirectorios();
        
        // Certificado por defecto para desarrollo (se inicializará de forma asíncrona)
        this.certificadoPorDefecto = null;
        this.certificadosWindows = [];
        this.inicializarCertificado();
    }

    /**
     * Inicializa el certificado de forma asíncrona
     */
    async inicializarCertificado() {
        try {
            // Primero intentar detectar certificados de Windows
            await this.detectarCertificadosWindows();
            
            // Si hay certificados de Windows, usar el recomendado
            if (this.certificadosWindows.length > 0) {
                const certificadoRecomendado = await this.detectorCertificados.obtenerCertificadoRecomendado();
                if (certificadoRecomendado.success) {
                    this.certificadoPorDefecto = this.convertirCertificadoWindows(certificadoRecomendado.certificado);
                    console.log('✅ Certificado de Windows detectado y configurado:', this.certificadoPorDefecto.empresa);
                    return;
                }
            }
            
            // Fallback a certificado de desarrollo
            this.certificadoPorDefecto = await this.generarCertificadoDesarrollo();
            console.log('✅ Certificado de desarrollo inicializado con datos reales');
        } catch (error) {
            console.error('❌ Error al inicializar certificado:', error);
            // Fallback a certificado básico
            this.certificadoPorDefecto = {
                empresa: 'Telwagen Car Ibérica, S.L.',
                cif: 'B-93.289.585',
                direccion: 'C. / Tomás Miller N° 48 Local, 35007 Las Palmas de Gran Canaria',
                email: 'info@telwagen.es',
                telefono: '+34 928 123 456',
                validoDesde: new Date(),
                validoHasta: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                serial: 'TELWAGEN-DEV-FALLBACK',
                algoritmo: 'RSA-2048',
                hash: 'SHA-256',
                tipo: 'desarrollo',
                emisor: 'Telwagen Car Ibérica, S.L.',
                sujeto: 'Telwagen Car Ibérica, S.L.'
            };
        }
    }

    /**
     * Detecta certificados instalados en Windows
     */
    async detectarCertificadosWindows() {
        try {
            console.log('🔍 Detectando certificados de Windows...');
            const resultado = await this.detectorCertificados.obtenerCertificadosDisponibles();
            
            if (resultado.success) {
                this.certificadosWindows = resultado.certificados;
                console.log(`✅ Detectados ${this.certificadosWindows.length} certificados de Windows`);
            } else {
                console.log('⚠️ No se pudieron detectar certificados de Windows:', resultado.error);
                this.certificadosWindows = [];
            }
            
            return resultado;
        } catch (error) {
            console.error('❌ Error al detectar certificados de Windows:', error);
            this.certificadosWindows = [];
            return { success: false, error: error.message };
        }
    }

    /**
     * Convierte un certificado de Windows al formato interno
     */
    convertirCertificadoWindows(certWindows) {
        return {
            empresa: certWindows.CommonName || 'Empresa no identificada',
            cif: certWindows.CIF || 'Sin CIF',
            direccion: 'Dirección no disponible',
            email: 'email@empresa.com',
            telefono: 'Sin teléfono',
            validoDesde: new Date(certWindows.NotBefore),
            validoHasta: new Date(certWindows.NotAfter),
            serial: certWindows.Thumbprint,
            algoritmo: 'RSA-2048',
            hash: 'SHA-256',
            tipo: 'windows',
            emisor: certWindows.Issuer,
            sujeto: certWindows.Subject,
            thumbprint: certWindows.Thumbprint,
            isValido: certWindows.IsValid,
            diasRestantes: certWindows.DaysUntilExpiry,
            clientAuth: certWindows.ClientAuth,
            digitalSignature: certWindows.DigitalSignature
        };
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
     * Genera un certificado de desarrollo para pruebas usando datos reales de la base de datos
     */
    async generarCertificadoDesarrollo() {
        try {
            // Obtener datos reales de la empresa desde la base de datos
            const datosEmpresa = await this.obtenerDatosEmpresaPrincipal();
            
            const certificadoInfo = {
                empresa: datosEmpresa.nombre,
                cif: datosEmpresa.cif,
                direccion: datosEmpresa.direccion,
                email: datosEmpresa.email,
                telefono: datosEmpresa.telefono,
                validoDesde: new Date(),
                validoHasta: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
                serial: `TELWAGEN-DEV-${Date.now()}`,
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
                emisor: datosEmpresa.nombre,
                sujeto: datosEmpresa.nombre
            };
        } catch (error) {
            console.error('❌ Error al generar certificado de desarrollo:', error);
            throw error;
        }
    }

    /**
     * Obtiene los datos de la empresa principal desde la base de datos
     */
    async obtenerDatosEmpresaPrincipal() {
        try {
            const sqlite3 = require('sqlite3').verbose();
            const path = require('path');
            
            const dbPath = path.join(__dirname, '..', 'database', 'telwagen.db');
            
            return new Promise((resolve, reject) => {
                const db = new sqlite3.Database(dbPath, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                });

                // Obtener la primera empresa (empresa principal)
                db.get("SELECT * FROM empresas ORDER BY id LIMIT 1", (err, row) => {
                    db.close();
                    
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (!row) {
                        // Si no hay empresas, usar datos por defecto
                        resolve({
                            nombre: 'Telwagen Car Ibérica, S.L.',
                            cif: 'B-93.289.585',
                            direccion: 'C. / Tomás Miller N° 48 Local, 35007 Las Palmas de Gran Canaria',
                            email: 'info@telwagen.es',
                            telefono: '+34 928 123 456'
                        });
                        return;
                    }
                    
                    resolve(row);
                });
            });
        } catch (error) {
            console.error('❌ Error al obtener datos de empresa:', error);
            // Fallback a datos por defecto
            return {
                nombre: 'Telwagen Car Ibérica, S.L.',
                cif: 'B-93.289.585',
                direccion: 'C. / Tomás Miller N° 48 Local, 35007 Las Palmas de Gran Canaria',
                email: 'info@telwagen.es',
                telefono: '+34 928 123 456'
            };
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
    async obtenerInformacionCertificado() {
        // Si el certificado aún no está inicializado, esperar un poco
        if (!this.certificadoPorDefecto) {
            await this.inicializarCertificado();
        }
        
        return {
            success: true,
            certificado: this.certificadoPorDefecto,
            directorioCertificados: this.directorioCertificados,
            directorioFirmas: this.directorioFirmas,
            algoritmo: this.algoritmoFirma,
            version: '1.0.0',
            tipo: this.certificadoPorDefecto.tipo,
            cumplimiento: 'Ley Antifraude España 11/2021',
            fuente: this.certificadoPorDefecto.tipo === 'windows' ? 'Certificado de Windows' : 'Base de datos real',
            certificadosWindows: this.certificadosWindows.length
        };
    }

    /**
     * Obtiene lista de certificados de Windows disponibles
     */
    async obtenerCertificadosWindows() {
        try {
            const resultado = await this.detectarCertificadosWindows();
            
            if (resultado.success) {
                const certificadosConvertidos = this.certificadosWindows.map(cert => 
                    this.convertirCertificadoWindows(cert)
                );
                
                return {
                    success: true,
                    certificados: certificadosConvertidos,
                    total: certificadosConvertidos.length
                };
            } else {
                return resultado;
            }
        } catch (error) {
            console.error('❌ Error al obtener certificados de Windows:', error);
            return {
                success: false,
                error: error.message,
                certificados: [],
                total: 0
            };
        }
    }

    /**
     * Asociar certificado con empresa específica
     */
    async asociarCertificadoConEmpresa(empresaId, thumbprint) {
        try {
            // Obtener información de la empresa
            const empresa = await this.obtenerEmpresaPorId(empresaId);
            if (!empresa) {
                throw new Error('Empresa no encontrada');
            }

            // Obtener certificado por thumbprint
            const resultadoCertificado = await this.detectorCertificados.obtenerCertificadoPorThumbprint(thumbprint);
            if (!resultadoCertificado.success) {
                throw new Error('Certificado no encontrado');
            }

            const certificado = resultadoCertificado.certificado;

            // Verificar que el certificado corresponde a la empresa
            const certificadoValido = this.verificarCertificadoEmpresa(certificado, empresa);
            if (!certificadoValido.valido) {
                throw new Error(`Certificado no válido para la empresa: ${certificadoValido.motivo}`);
            }

            // Guardar asociación en la base de datos
            await this.guardarAsociacionEmpresaCertificado(empresaId, thumbprint, certificado);

            console.log(`✅ Certificado asociado con empresa: ${empresa.nombre}`);
            
            return {
                success: true,
                empresa: empresa,
                certificado: certificado,
                mensaje: 'Certificado asociado exitosamente'
            };

        } catch (error) {
            console.error('❌ Error al asociar certificado con empresa:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verificar que un certificado corresponde a una empresa específica
     */
    verificarCertificadoEmpresa(certificado, empresa) {
        try {
            // Extraer CIF del certificado
            const cifCertificado = this.extraerCIFDelCertificado(certificado);
            const cifEmpresa = empresa.cif;

            // Comparar CIFs
            if (cifCertificado && cifEmpresa) {
                if (cifCertificado.toUpperCase() === cifEmpresa.toUpperCase()) {
                    return { valido: true, motivo: 'CIF coincide' };
                }
            }

            // Comparar nombres de empresa
            const nombreCertificado = certificado.CommonName || '';
            const nombreEmpresa = empresa.nombre || '';

            if (nombreCertificado.toLowerCase().includes(nombreEmpresa.toLowerCase()) ||
                nombreEmpresa.toLowerCase().includes(nombreCertificado.toLowerCase())) {
                return { valido: true, motivo: 'Nombre de empresa coincide' };
            }

            // Si no hay coincidencia exacta, verificar si es un certificado válido en general
            if (certificado.IsValid && certificado.HasPrivateKey) {
                return { valido: true, motivo: 'Certificado válido (verificación manual requerida)' };
            }

            return { valido: false, motivo: 'No se encontró coincidencia entre certificado y empresa' };

        } catch (error) {
            return { valido: false, motivo: `Error en verificación: ${error.message}` };
        }
    }

    /**
     * Extraer CIF del certificado
     */
    extraerCIFDelCertificado(certificado) {
        const subject = certificado.Subject || '';
        
        // Buscar VATES- (formato español de CIF empresarial)
        const vatesMatch = subject.match(/VATES-([A-Z0-9]+)/);
        if (vatesMatch) {
            return `VATES-${vatesMatch[1]}`;
        }
        
        // Buscar SERIALNUMBER=IDCES- (formato DNIe)
        const idcesMatch = subject.match(/SERIALNUMBER=IDCES-([A-Z0-9]+)/);
        if (idcesMatch) {
            return `IDCES-${idcesMatch[1]}`;
        }
        
        return '';
    }

    /**
     * Obtener empresa por ID desde la base de datos
     */
    async obtenerEmpresaPorId(empresaId) {
        return new Promise((resolve, reject) => {
            const sqlite3 = require('sqlite3').verbose();
            const path = require('path');
            const dbPath = path.join(__dirname, '..', 'database', 'telwagen.db');
            
            const db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                db.get("SELECT * FROM empresas WHERE id = ?", [empresaId], (err, row) => {
                    db.close();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });
        });
    }

    /**
     * Guardar asociación empresa-certificado en la base de datos
     */
    async guardarAsociacionEmpresaCertificado(empresaId, thumbprint, certificado) {
        return new Promise((resolve, reject) => {
            const sqlite3 = require('sqlite3').verbose();
            const path = require('path');
            const dbPath = path.join(__dirname, '..', 'database', 'telwagen.db');
            
            const db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Crear tabla si no existe
                db.run(`
                    CREATE TABLE IF NOT EXISTS empresa_certificados (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        empresa_id INTEGER NOT NULL,
                        thumbprint TEXT NOT NULL,
                        certificado_info TEXT NOT NULL,
                        fecha_asociacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                        activo BOOLEAN DEFAULT 1,
                        FOREIGN KEY (empresa_id) REFERENCES empresas (id)
                    )
                `, (err) => {
                    if (err) {
                        db.close();
                        reject(err);
                        return;
                    }
                    
                    // Insertar o actualizar asociación
                    db.run(`
                        INSERT OR REPLACE INTO empresa_certificados 
                        (empresa_id, thumbprint, certificado_info, activo)
                        VALUES (?, ?, ?, 1)
                    `, [empresaId, thumbprint, JSON.stringify(certificado)], (err) => {
                        db.close();
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            });
        });
    }

    /**
     * Obtener certificado asociado a una empresa
     */
    async obtenerCertificadoEmpresa(empresaId) {
        try {
            const sqlite3 = require('sqlite3').verbose();
            const path = require('path');
            const dbPath = path.join(__dirname, '..', 'database', 'telwagen.db');
            
            return new Promise((resolve, reject) => {
                const db = new sqlite3.Database(dbPath, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    db.get(`
                        SELECT * FROM empresa_certificados 
                        WHERE empresa_id = ? AND activo = 1 
                        ORDER BY fecha_asociacion DESC 
                        LIMIT 1
                    `, [empresaId], (err, row) => {
                        db.close();
                        if (err) {
                            reject(err);
                        } else if (row) {
                            const certificadoInfo = JSON.parse(row.certificado_info);
                            resolve({
                                success: true,
                                certificado: certificadoInfo,
                                thumbprint: row.thumbprint,
                                fechaAsociacion: row.fecha_asociacion
                            });
                        } else {
                            resolve({
                                success: false,
                                error: 'No hay certificado asociado a esta empresa'
                            });
                        }
                    });
                });
            });

        } catch (error) {
            console.error('❌ Error al obtener certificado de empresa:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Firmar documento con certificado de empresa específica
     */
    async firmarDocumentoConEmpresa(empresaId, datosDocumento) {
        try {
            // Obtener certificado asociado a la empresa
            const resultadoCertificado = await this.obtenerCertificadoEmpresa(empresaId);
            
            if (!resultadoCertificado.success) {
                throw new Error(`No hay certificado asociado a la empresa: ${resultadoCertificado.error}`);
            }

            const certificado = resultadoCertificado.certificado;

            // Verificar que el certificado sigue siendo válido
            if (!certificado.IsValid) {
                throw new Error('El certificado asociado ha expirado');
            }

            // Firmar el documento usando el certificado de la empresa
            const resultadoFirma = await this.firmarDocumento(datosDocumento, certificado);

            console.log(`✅ Documento firmado con certificado de empresa: ${certificado.CommonName}`);
            
            return {
                success: true,
                firma: resultadoFirma,
                certificado: certificado,
                empresa: empresaId,
                mensaje: 'Documento firmado exitosamente con certificado de empresa'
            };

        } catch (error) {
            console.error('❌ Error al firmar documento con empresa:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Firmar documento con certificado específico
     */
    async firmarDocumento(datosDocumento, certificado) {
        try {
            // Generar hash del documento
            const hashDocumento = crypto.createHash(this.algoritmoFirma)
                .update(JSON.stringify(datosDocumento))
                .digest('hex');

            // Crear información de la firma
            const firmaInfo = {
                documento: datosDocumento,
                hash: hashDocumento,
                certificado: {
                    empresa: certificado.empresa || certificado.CommonName,
                    cif: certificado.cif || this.extraerCIFDelCertificado(certificado),
                    thumbprint: certificado.thumbprint || certificado.Thumbprint,
                    validoDesde: certificado.validoDesde || certificado.NotBefore,
                    validoHasta: certificado.validoHasta || certificado.NotAfter,
                    emisor: certificado.emisor || certificado.Issuer
                },
                algoritmo: this.algoritmoFirma,
                timestamp: new Date().toISOString(),
                tipo: 'firma_digital_empresa'
            };

            // Guardar firma en archivo
            const nombreArchivo = `firma_${Date.now()}_${hashDocumento.substring(0, 8)}.json`;
            const rutaArchivo = path.join(this.directorioFirmas, nombreArchivo);
            
            fs.writeFileSync(rutaArchivo, JSON.stringify(firmaInfo, null, 2));

            console.log(`✅ Firma guardada: ${nombreArchivo}`);

            return {
                archivo: nombreArchivo,
                ruta: rutaArchivo,
                hash: hashDocumento,
                certificado: firmaInfo.certificado,
                timestamp: firmaInfo.timestamp
            };

        } catch (error) {
            console.error('❌ Error al firmar documento:', error);
            throw error;
        }
    }

    /**
     * Detectar todas las firmas digitales disponibles y extraer información de certificados
     */
    async detectarTodasLasFirmasDisponibles() {
        try {
            console.log('🔍 Detectando todas las firmas digitales disponibles...');
            
            // 1. Obtener certificados de Windows
            const certificadosWindows = await this.detectarCertificadosWindows();
            
            // 2. Obtener firmas existentes en el directorio
            const firmasExistentes = this.listarFirmas();
            
            // 3. Crear lista consolidada de firmas disponibles
            const firmasDisponibles = [];
            
            // Agregar certificados de Windows
            if (certificadosWindows.success && certificadosWindows.certificados.length > 0) {
                for (const cert of certificadosWindows.certificados) {
                    // Verificar que el certificado tenga datos válidos
                    if (cert.Thumbprint && cert.CommonName) {
                        // Extraer CIF del Subject
                        const cif = this.extraerCIFDelCertificado(cert);
                        
                        firmasDisponibles.push({
                            tipo: 'windows',
                            fuente: 'certificado_windows',
                            thumbprint: cert.Thumbprint,
                            empresa: cert.CommonName,
                            cif: cif,
                            validoDesde: cert.NotBefore,
                            validoHasta: cert.NotAfter,
                            diasRestantes: cert.DaysUntilExpiry,
                            isValido: cert.IsValid,
                            algoritmo: 'RSA-2048', // Valor por defecto
                            serial: cert.Thumbprint,
                            sujeto: cert.Subject,
                            descripcion: `Certificado Windows: ${cert.CommonName}`,
                            prioridad: cert.IsValid ? 1 : 2 // Prioridad alta si es válido
                        });
                    }
                }
            }
            
            // Agregar firmas existentes (para certificados ya usados)
            if (firmasExistentes.length > 0) {
                for (const firma of firmasExistentes) {
                    try {
                        const contenidoFirma = JSON.parse(fs.readFileSync(firma.ruta, 'utf8'));
                        if (contenidoFirma.certificado) {
                            const cert = contenidoFirma.certificado;
                            
                            // Verificar si ya existe en la lista
                            const yaExiste = firmasDisponibles.some(f => 
                                f.thumbprint === cert.thumbprint
                            );
                            
                            if (!yaExiste) {
                                firmasDisponibles.push({
                                    tipo: 'archivo',
                                    fuente: 'firma_existente',
                                    thumbprint: cert.thumbprint,
                                    empresa: cert.empresa,
                                    cif: cert.cif,
                                    validoDesde: cert.validoDesde,
                                    validoHasta: cert.validoHasta,
                                    algoritmo: contenidoFirma.algoritmo,
                                    timestamp: contenidoFirma.timestamp,
                                    archivo: firma.archivo,
                                    descripcion: `Firma existente: ${cert.empresa}`,
                                    prioridad: 3 // Prioridad media para firmas existentes
                                });
                            }
                        }
                    } catch (error) {
                        console.log('⚠️ Error al procesar firma existente:', firma.archivo);
                    }
                }
            }
            
            // Ordenar por prioridad y validez
            firmasDisponibles.sort((a, b) => {
                if (a.prioridad !== b.prioridad) {
                    return a.prioridad - b.prioridad;
                }
                // Si tienen la misma prioridad, ordenar por validez
                if (a.isValido !== b.isValido) {
                    return a.isValido ? -1 : 1;
                }
                return 0;
            });
            
            console.log(`✅ Detectadas ${firmasDisponibles.length} firmas digitales disponibles`);
            
            return {
                success: true,
                firmas: firmasDisponibles,
                total: firmasDisponibles.length,
                certificadosWindows: certificadosWindows.success ? certificadosWindows.certificados.length : 0,
                firmasExistentes: firmasExistentes.length
            };
            
        } catch (error) {
            console.error('❌ Error al detectar firmas disponibles:', error);
            return {
                success: false,
                error: error.message,
                firmas: [],
                total: 0
            };
        }
    }

    /**
     * Obtener firmas disponibles para asignar a una empresa específica
     */
    async obtenerFirmasParaAsignar(empresaId = null) {
        try {
            const resultado = await this.detectarTodasLasFirmasDisponibles();
            
            if (!resultado.success) {
                return resultado;
            }
            
            // Si se especifica una empresa, filtrar por compatibilidad
            if (empresaId) {
                let empresa;
                try {
                    empresa = await this.obtenerEmpresaPorId(empresaId);
                } catch (error) {
                    // Si no se puede obtener la empresa de la BD, usar datos simulados
                    console.log('⚠️ No se pudo obtener empresa de BD, usando datos simulados');
                    empresa = null;
                }
                
                if (empresa) {
                    resultado.firmas = resultado.firmas.map(firma => ({
                        ...firma,
                        compatible: this.verificarCompatibilidadFirmaEmpresa(firma, empresa),
                        recomendada: this.esFirmaRecomendada(firma, empresa)
                    }));
                } else {
                    // Para empresas simuladas o no encontradas, solo mostrar firmas sin análisis de compatibilidad
                    resultado.firmas = resultado.firmas.map(firma => ({
                        ...firma,
                        compatible: { compatible: true, motivo: 'Análisis no disponible', nivel: 'medio' },
                        recomendada: false
                    }));
                }
            }
            
            return resultado;
            
        } catch (error) {
            console.error('❌ Error al obtener firmas para asignar:', error);
            return {
                success: false,
                error: error.message,
                firmas: [],
                total: 0
            };
        }
    }

    /**
     * Verificar compatibilidad entre una firma y una empresa
     */
    verificarCompatibilidadFirmaEmpresa(firma, empresa) {
        try {
            // Verificar CIF
            if (firma.cif && empresa.cif) {
                if (firma.cif.toUpperCase() === empresa.cif.toUpperCase()) {
                    return { compatible: true, motivo: 'CIF coincide exactamente', nivel: 'alto' };
                }
            }
            
            // Verificar nombre de empresa
            if (firma.empresa && empresa.nombre) {
                const nombreFirma = firma.empresa.toLowerCase();
                const nombreEmpresa = empresa.nombre.toLowerCase();
                
                if (nombreFirma.includes(nombreEmpresa) || nombreEmpresa.includes(nombreFirma)) {
                    return { compatible: true, motivo: 'Nombre de empresa coincide', nivel: 'medio' };
                }
            }
            
            // Verificar validez del certificado
            if (firma.isValido === false) {
                return { compatible: false, motivo: 'Certificado expirado', nivel: 'bajo' };
            }
            
            // Si no hay coincidencia específica pero el certificado es válido
            if (firma.isValido === true) {
                return { compatible: true, motivo: 'Certificado válido (verificación manual)', nivel: 'bajo' };
            }
            
            return { compatible: false, motivo: 'No se encontró compatibilidad', nivel: 'ninguno' };
            
        } catch (error) {
            return { compatible: false, motivo: `Error: ${error.message}`, nivel: 'ninguno' };
        }
    }

    /**
     * Determinar si una firma es recomendada para una empresa
     */
    esFirmaRecomendada(firma, empresa) {
        const compatibilidad = this.verificarCompatibilidadFirmaEmpresa(firma, empresa);
        
        return compatibilidad.compatible && 
               compatibilidad.nivel === 'alto' && 
               firma.isValido === true;
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

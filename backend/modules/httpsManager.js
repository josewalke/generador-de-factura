const https = require('https');
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');
const config = require('../config/config');

class HTTPSManager {
    constructor() {
        this.certPath = path.join(__dirname, '..', 'certificates');
        this.certFile = path.join(this.certPath, 'server.crt');
        this.keyFile = path.join(this.certPath, 'server.key');
        this.isElectronMode = config.get('electron.electronMode') || false;
    }

    /**
     * Generar certificado SSL autofirmado para desarrollo local
     */
    generateSelfSignedCert() {
        try {
            // Crear directorio de certificados si no existe
            if (!fs.existsSync(this.certPath)) {
                fs.mkdirSync(this.certPath, { recursive: true });
            }

            // Verificar si ya existen certificados
            if (fs.existsSync(this.certFile) && fs.existsSync(this.keyFile)) {
                console.log('✅ Certificados SSL ya existen');
                return {
                    cert: fs.readFileSync(this.certFile),
                    key: fs.readFileSync(this.keyFile)
                };
            }

            console.log('🔐 Generando certificado SSL autofirmado para desarrollo local...');

            // Generar certificado autofirmado
            const attrs = [
                { name: 'commonName', value: 'localhost' },
                { name: 'countryName', value: 'ES' },
                { name: 'stateOrProvinceName', value: 'Las Palmas' },
                { name: 'localityName', value: 'Las Palmas de Gran Canaria' },
                { name: 'organizationName', value: 'Telwagen Desktop App' },
                { name: 'organizationalUnitName', value: 'Development' }
            ];

            const options = {
                keySize: 2048,
                days: 365,
                algorithm: 'sha256',
                extensions: [
                    {
                        name: 'basicConstraints',
                        cA: true
                    },
                    {
                        name: 'keyUsage',
                        keyCertSign: true,
                        digitalSignature: true,
                        nonRepudiation: true,
                        keyEncipherment: true,
                        dataEncipherment: true
                    },
                    {
                        name: 'subjectAltName',
                        altNames: [
                            {
                                type: 2, // DNS
                                value: 'localhost'
                            },
                            {
                                type: 7, // IP
                                ip: '127.0.0.1'
                            },
                            {
                                type: 7, // IP
                                ip: '::1'
                            }
                        ]
                    }
                ]
            };

            const pems = selfsigned.generate(attrs, options);

            // Guardar certificados
            fs.writeFileSync(this.certFile, pems.cert);
            fs.writeFileSync(this.keyFile, pems.private);

            console.log('✅ Certificado SSL generado exitosamente');
            console.log(`📁 Certificado: ${this.certFile}`);
            console.log(`🔑 Clave privada: ${this.keyFile}`);

            return {
                cert: pems.cert,
                key: pems.private
            };
        } catch (error) {
            console.error('❌ Error generando certificado SSL:', error);
            throw error;
        }
    }

    /**
     * Crear servidor HTTPS
     * @param {Object} app - Aplicación Express
     * @returns {Object} Servidor HTTPS
     */
    createHTTPSServer(app) {
        try {
            if (config.get('server.environment') === 'production') {
                console.log('⚠️ En producción, usar certificados SSL reales');
                return null;
            }

            const sslOptions = this.generateSelfSignedCert();
            
            const httpsServer = https.createServer(sslOptions, app);
            
            console.log('🔒 Servidor HTTPS configurado para desarrollo local');
            console.log('⚠️ IMPORTANTE: Este es un certificado autofirmado solo para desarrollo');
            console.log('⚠️ En producción, usar certificados SSL reales de una CA confiable');
            
            return httpsServer;
        } catch (error) {
            console.error('❌ Error creando servidor HTTPS:', error);
            return null;
        }
    }

    /**
     * Configurar HTTPS para aplicación de escritorio
     * @param {Object} app - Aplicación Express
     * @param {number} port - Puerto HTTPS
     * @returns {Promise<Object>} Servidor HTTPS
     */
    async setupHTTPSForDesktop(app, port = 3443) {
        try {
            // Solo configurar HTTPS si está en modo Electron
            if (!this.isElectronMode) {
                console.log('ℹ️ Modo Electron no detectado, usando HTTP');
                return null;
            }

            const httpsServer = this.createHTTPSServer(app);
            
            if (!httpsServer) {
                return null;
            }

            // Iniciar servidor HTTPS
            httpsServer.listen(port, 'localhost', () => {
                console.log(`🔒 Servidor HTTPS ejecutándose en https://localhost:${port}`);
                console.log('📱 La aplicación de escritorio puede conectarse de forma segura');
            });

            // Manejar errores
            httpsServer.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.log(`⚠️ Puerto ${port} ya está en uso, usando HTTP`);
                } else {
                    console.error('❌ Error en servidor HTTPS:', error);
                }
            });

            return httpsServer;
        } catch (error) {
            console.error('❌ Error configurando HTTPS para desktop:', error);
            return null;
        }
    }

    /**
     * Obtener información del certificado
     * @returns {Object} Información del certificado
     */
    getCertificateInfo() {
        try {
            if (!fs.existsSync(this.certFile)) {
                return null;
            }

            const cert = fs.readFileSync(this.certFile, 'utf8');
            const lines = cert.split('\n');
            
            return {
                exists: true,
                path: this.certFile,
                keyPath: this.keyFile,
                isSelfSigned: cert.includes('BEGIN CERTIFICATE'),
                lines: lines.length
            };
        } catch (error) {
            console.error('Error obteniendo información del certificado:', error);
            return null;
        }
    }

    /**
     * Limpiar certificados (para desarrollo)
     */
    cleanupCertificates() {
        try {
            if (fs.existsSync(this.certFile)) {
                fs.unlinkSync(this.certFile);
            }
            if (fs.existsSync(this.keyFile)) {
                fs.unlinkSync(this.keyFile);
            }
            console.log('🧹 Certificados SSL limpiados');
        } catch (error) {
            console.error('Error limpiando certificados:', error);
        }
    }
}

module.exports = HTTPSManager;







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

            console.log('🔐 Generando certificado SSL autofirmado...');

            // Obtener IPs locales para incluir en el certificado
            const os = require('os');
            const networkInterfaces = os.networkInterfaces();
            const altNames = [
                { type: 2, value: 'localhost' },
                { type: 7, ip: '127.0.0.1' },
                { type: 7, ip: '::1' }
            ];

            // Agregar IPs de red local
            Object.keys(networkInterfaces).forEach((interfaceName) => {
                networkInterfaces[interfaceName].forEach((iface) => {
                    if (iface.family === 'IPv4' && !iface.internal) {
                        altNames.push({ type: 7, ip: iface.address });
                    }
                });
            });

            // Agregar IP pública conocida
            altNames.push({ type: 7, ip: '92.186.17.227' });

            // Generar certificado autofirmado
            const attrs = [
                { name: 'commonName', value: 'telwagen-backend' },
                { name: 'countryName', value: 'ES' },
                { name: 'stateOrProvinceName', value: 'Las Palmas' },
                { name: 'localityName', value: 'Las Palmas de Gran Canaria' },
                { name: 'organizationName', value: 'Telwagen' },
                { name: 'organizationalUnitName', value: 'Backend Server' }
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
                        altNames: altNames
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
            console.log('⚠️  Certificado autofirmado - para producción usa Let\'s Encrypt');

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
     * @param {number} port - Puerto HTTPS
     * @returns {Object} Servidor HTTPS
     */
    createHTTPSServer(app, port = 8443) {
        try {
            let sslOptions;
            
            // Intentar cargar certificados reales primero
            if (fs.existsSync(this.certFile) && fs.existsSync(this.keyFile)) {
                try {
                    sslOptions = {
                        cert: fs.readFileSync(this.certFile),
                        key: fs.readFileSync(this.keyFile)
                    };
                    console.log('✅ Certificados SSL cargados desde archivos');
                } catch (error) {
                    console.warn('⚠️ Error cargando certificados, generando autofirmado...');
                    sslOptions = this.generateSelfSignedCert();
                }
            } else {
                // Generar certificado autofirmado
                console.log('🔐 Generando certificado SSL autofirmado...');
                sslOptions = this.generateSelfSignedCert();
            }
            
            const httpsServer = https.createServer(sslOptions, app);
            
            // Iniciar servidor HTTPS
            httpsServer.listen(port, '0.0.0.0', () => {
                console.log(`🔒 Servidor HTTPS ejecutándose en https://0.0.0.0:${port}`);
                console.log(`🌐 Acceso desde Internet: https://92.186.17.227:${port}`);
                console.log('⚠️ NOTA: Certificado autofirmado - los navegadores mostrarán advertencia');
                console.log('   Para producción, usa certificados de Let\'s Encrypt');
            });
            
            httpsServer.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.log(`⚠️ Puerto HTTPS ${port} ya está en uso`);
                } else {
                    console.error('❌ Error en servidor HTTPS:', error);
                }
            });
            
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







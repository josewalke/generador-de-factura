const { exec } = require('child_process');
const path = require('path');

class DetectorCertificadosWindows {
    constructor() {
        this.certificadosDisponibles = [];
        this.inicializado = false;
    }

    // Función para listar certificados usando certutil
    async inicializar() {
        try {
            console.log('🔍 Inicializando detector de certificados de Windows...');
            this.inicializado = true;
            console.log('✅ Detector de certificados de Windows inicializado');
            return true;
        } catch (error) {
            console.error('❌ Error al inicializar detector de certificados:', error);
            this.inicializado = false;
            return false;
        }
    }

    // Obtener lista de certificados disponibles usando certutil
    async obtenerCertificadosDisponibles() {
        if (!this.inicializado) {
            await this.inicializar();
        }

        try {
            console.log('🔍 Buscando certificados instalados en Windows...');
            
            // Intentar primero con PowerShell para obtener fechas reales
            let certificados = await this.listarCertificadosPowerShell();
            
            // Si PowerShell falla, usar certutil como fallback
            if (certificados.length === 0) {
                console.log('⚠️ PowerShell falló, usando certutil como fallback...');
                certificados = await this.listarCertificadosCertutil();
            }
            
            this.certificadosDisponibles = certificados;
            
            console.log(`✅ Encontrados ${this.certificadosDisponibles.length} certificados válidos`);
            
            // Log de certificados encontrados
            this.certificadosDisponibles.forEach((cert, index) => {
                console.log(`📋 Certificado ${index + 1}:`);
                console.log(`   - Nombre: ${cert.CommonName || this.extraerCommonName(cert.Subject)}`);
                console.log(`   - CIF: ${cert.CIF || this.extraerCIF(cert.Subject) || 'No disponible'}`);
                console.log(`   - Válido: ${cert.IsValid ? 'Sí' : 'No'}`);
                console.log(`   - Válido desde: ${cert.NotBefore || 'No disponible'}`);
                console.log(`   - Válido hasta: ${cert.NotAfter || 'No disponible'}`);
                console.log(`   - Días restantes: ${cert.DaysUntilExpiry || 'No disponible'}`);
            });

            return {
                success: true,
                certificados: this.certificadosDisponibles,
                total: this.certificadosDisponibles.length
            };

        } catch (error) {
            console.error('❌ Error al obtener certificados:', error);
            return {
                success: false,
                error: error.message,
                certificados: [],
                total: 0
            };
        }
    }

    // Listar certificados usando PowerShell para obtener fechas reales
    listarCertificadosPowerShell() {
        return new Promise((resolve, reject) => {
            exec('powershell -ExecutionPolicy Bypass -File get_certs_improved.ps1', { windowsHide: true }, (err, stdout, stderr) => {
                if (err) {
                    console.warn('⚠️ No se pudo ejecutar PowerShell:', err.message);
                    resolve([]);
                    return;
                }

                try {
                    // Limpiar la salida de PowerShell
                    const cleanOutput = stdout.trim();
                    if (!cleanOutput || cleanOutput === '[]') {
                        resolve([]);
                        return;
                    }
                    
                    // El script devuelve un objeto individual, no un array
                    let certificados;
                    if (cleanOutput.startsWith('{')) {
                        certificados = [JSON.parse(cleanOutput)];
                    } else {
                        certificados = JSON.parse(cleanOutput);
                    }
                    
                    resolve(Array.isArray(certificados) ? certificados : []);
                } catch (parseError) {
                    console.warn('⚠️ Error al parsear certificados de PowerShell:', parseError.message);
                    console.warn('Salida recibida:', stdout);
                    resolve([]);
                }
            });
        });
    }

    // Listar certificados usando certutil (fallback)
    listarCertificadosCertutil() {
        return new Promise((resolve, reject) => {
            exec('certutil -store -user My', { windowsHide: true }, (err, stdout, stderr) => {
                if (err) {
                    console.warn('⚠️ No se pudo ejecutar certutil:', err.message);
                    resolve([]);
                    return;
                }

                try {
                    const certificados = this.parsearCertificados(stdout);
                    resolve(certificados);
                } catch (parseError) {
                    console.warn('⚠️ Error al parsear certificados:', parseError.message);
                    resolve([]);
                }
            });
        });
    }

    // Parsear la salida de certutil
    parsearCertificados(stdout) {
        const certificados = [];
        
        // Buscar patrones específicos en la salida de certutil
        const lines = stdout.split(/\r?\n/);
        
        let certificadoActual = {};
        let enBloqueCertificado = false;
        
        for (let i = 0; i < lines.length; i++) {
            const linea = lines[i].trim();
            
            // Buscar Sujeto: CN= en líneas que contengan información del sujeto
            if (linea.includes('Sujeto:') && linea.includes('CN=')) {
                certificadoActual = {};
                enBloqueCertificado = true;
                
                // Extraer información del Subject
                const cnMatch = linea.match(/CN=([^,)]+)/);
                if (cnMatch) {
                    certificadoActual.CommonName = cnMatch[1];
                    certificadoActual.Subject = linea;
                    certificadoActual.CIF = this.extraerCIF(linea);
                }
            }
            
            // También buscar Emisor: para obtener información del emisor
            if (enBloqueCertificado && linea.includes('Emisor:')) {
                const issuerMatch = linea.match(/Emisor:\s*(.+)/);
                if (issuerMatch) {
                    certificadoActual.Issuer = issuerMatch[1];
                }
            }
            
            // Buscar información de fechas en líneas que contengan fechas
            if (enBloqueCertificado && (linea.includes('NotBefore') || linea.includes('NotAfter'))) {
                const fechaMatch = linea.match(/(NotBefore|NotAfter):\s*(.+)/);
                if (fechaMatch) {
                    if (fechaMatch[1] === 'NotBefore') {
                        certificadoActual.NotBefore = fechaMatch[2];
                    } else if (fechaMatch[1] === 'NotAfter') {
                        certificadoActual.NotAfter = fechaMatch[2];
                    }
                }
            }
            
            // Buscar Serial Number
            if (enBloqueCertificado && linea.includes('Serial Number:')) {
                const serialMatch = linea.match(/Serial Number:\s*(.+)/);
                if (serialMatch) {
                    certificadoActual.Thumbprint = serialMatch[1];
                }
            }
            
            // Buscar Issuer
            if (enBloqueCertificado && linea.includes('Issuer:')) {
                const issuerMatch = linea.match(/Issuer:\s*(.+)/);
                if (issuerMatch) {
                    certificadoActual.Issuer = issuerMatch[1];
                }
            }
            
            // Detectar clave privada
            if (enBloqueCertificado && linea.includes('Clave privada:')) {
                certificadoActual.HasPrivateKey = true;
            }
            
            // Detectar fin del certificado
            if (enBloqueCertificado && linea.includes('CertUtil:')) {
                // Si tenemos información suficiente, agregar el certificado
                if (certificadoActual.CommonName) {
                    // Completar información faltante
                    certificadoActual.HasPrivateKey = certificadoActual.HasPrivateKey || false;
                    certificadoActual.ClientAuth = true;
                    certificadoActual.DigitalSignature = true;
                    
                    // Generar thumbprint si no existe
                    if (!certificadoActual.Thumbprint) {
                        certificadoActual.Thumbprint = this.generarThumbprint(certificadoActual.CommonName);
                    }
                    
                    // Calcular validez
                    if (certificadoActual.NotBefore && certificadoActual.NotAfter) {
                        const fechaActual = new Date();
                        const fechaNotAfter = new Date(certificadoActual.NotAfter);
                        const fechaNotBefore = new Date(certificadoActual.NotBefore);
                        
                        certificadoActual.IsValid = fechaNotBefore <= fechaActual && fechaNotAfter > fechaActual;
                        certificadoActual.DaysUntilExpiry = Math.ceil((fechaNotAfter - fechaActual) / (1000 * 60 * 60 * 24));
                    } else {
                        certificadoActual.IsValid = true; // Asumir válido si no tenemos fechas
                        certificadoActual.DaysUntilExpiry = 365;
                    }
                    
                    certificados.push(certificadoActual);
                }
                
                enBloqueCertificado = false;
            }
        }
        
        // Procesar último certificado si quedó pendiente
        if (enBloqueCertificado && certificadoActual.CommonName) {
            certificadoActual.HasPrivateKey = certificadoActual.HasPrivateKey || false;
            certificadoActual.ClientAuth = true;
            certificadoActual.DigitalSignature = true;
            
            if (!certificadoActual.Thumbprint) {
                certificadoActual.Thumbprint = this.generarThumbprint(certificadoActual.CommonName);
            }
            
            if (certificadoActual.NotBefore && certificadoActual.NotAfter) {
                const fechaActual = new Date();
                const fechaNotAfter = new Date(certificadoActual.NotAfter);
                const fechaNotBefore = new Date(certificadoActual.NotBefore);
                
                certificadoActual.IsValid = fechaNotBefore <= fechaActual && fechaNotAfter > fechaActual;
                certificadoActual.DaysUntilExpiry = Math.ceil((fechaNotAfter - fechaActual) / (1000 * 60 * 60 * 24));
            } else {
                certificadoActual.IsValid = true;
                certificadoActual.DaysUntilExpiry = 365;
            }
            
            certificados.push(certificadoActual);
        }
        
        return certificados;
    }

    // Generar thumbprint basado en el nombre común
    generarThumbprint(commonName) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(commonName).digest('hex').substring(0, 16).toUpperCase();
    }

    // Parsear un bloque individual de certificado
    parsearBloqueCertificado(bloque) {
        const lineas = bloque.split(/\r?\n/);
        
        let thumbprint = '';
        let subject = '';
        let issuer = '';
        let notBefore = '';
        let notAfter = '';
        let hasPrivateKey = false;
        
        for (const linea of lineas) {
            const lineaTrim = linea.trim();
            
            if (lineaTrim.startsWith('Serial Number:')) {
                thumbprint = lineaTrim.split(':')[1].trim();
            } else if (lineaTrim.startsWith('Subject:')) {
                subject = lineaTrim.split(':')[1].trim();
            } else if (lineaTrim.startsWith('Issuer:')) {
                issuer = lineaTrim.split(':')[1].trim();
            } else if (lineaTrim.startsWith('NotBefore:')) {
                notBefore = lineaTrim.split(':')[1].trim();
            } else if (lineaTrim.startsWith('NotAfter:')) {
                notAfter = lineaTrim.split(':')[1].trim();
            } else if (lineaTrim.includes('Signature matches')) {
                hasPrivateKey = true;
            }
        }
        
        // Solo procesar certificados con información básica
        if (!thumbprint || !subject) {
            return null;
        }
        
        // Extraer Common Name del Subject
        const commonName = this.extraerCommonName(subject);
        
        // Extraer CIF/NIF del Subject
        const cif = this.extraerCIF(subject);
        
        // Verificar validez
        const fechaActual = new Date();
        const fechaNotAfter = new Date(notAfter);
        const fechaNotBefore = new Date(notBefore);
        
        const isValido = fechaNotBefore <= fechaActual && fechaNotAfter > fechaActual;
        const diasRestantes = Math.ceil((fechaNotAfter - fechaActual) / (1000 * 60 * 60 * 24));
        
        return {
            Thumbprint: thumbprint,
            Subject: subject,
            Issuer: issuer,
            CommonName: commonName,
            CIF: cif,
            NotBefore: notBefore,
            NotAfter: notAfter,
            HasPrivateKey: hasPrivateKey,
            ClientAuth: true, // Asumir que los certificados del almacén personal tienen este uso
            DigitalSignature: true,
            IsValid: isValido,
            DaysUntilExpiry: diasRestantes
        };
    }

    // Extraer Common Name del Subject
    extraerCommonName(subject) {
        const partes = subject.split(',');
        for (const parte of partes) {
            const parteTrim = parte.trim();
            if (parteTrim.startsWith('CN=')) {
                return parteTrim.substring(3);
            }
        }
        return subject; // Fallback al subject completo
    }

    // Extraer CIF/NIF del Subject
    extraerCIF(subject) {
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
        
        // Buscar SN= (apellidos)
        const snMatch = subject.match(/SN=([^,]+)/);
        if (snMatch) {
            return snMatch[1];
        }
        
        return '';
    }

    // Obtener certificado por thumbprint
    async obtenerCertificadoPorThumbprint(thumbprint) {
        const resultado = await this.obtenerCertificadosDisponibles();
        
        if (!resultado.success) {
            return resultado;
        }

        const certificado = this.certificadosDisponibles.find(cert => 
            (cert.Thumbprint || cert.thumbprint) && 
            (cert.Thumbprint || cert.thumbprint).toLowerCase() === thumbprint.toLowerCase()
        );

        if (!certificado) {
            return {
                success: false,
                error: 'Certificado no encontrado'
            };
        }

        return {
            success: true,
            certificado: certificado
        };
    }

    // Obtener certificado más reciente y válido
    async obtenerCertificadoRecomendado() {
        const resultado = await this.obtenerCertificadosDisponibles();
        
        if (!resultado.success || resultado.certificados.length === 0) {
            return {
                success: false,
                error: 'No hay certificados disponibles'
            };
        }

        // Filtrar solo certificados válidos
        const certificadosValidos = resultado.certificados.filter(cert => cert.IsValid);
        
        if (certificadosValidos.length === 0) {
            return {
                success: false,
                error: 'No hay certificados válidos disponibles'
            };
        }

        // Ordenar por fecha de expiración (más lejana primero)
        certificadosValidos.sort((a, b) => {
            const fechaA = new Date(a.NotAfter);
            const fechaB = new Date(b.NotAfter);
            return fechaB - fechaA;
        });

        return {
            success: true,
            certificado: certificadosValidos[0],
            recomendacion: 'Certificado más reciente y válido'
        };
    }

    // Verificar si hay certificados disponibles
    async hayCertificadosDisponibles() {
        const resultado = await this.obtenerCertificadosDisponibles();
        return resultado.success && resultado.total > 0;
    }
}

module.exports = DetectorCertificadosWindows;

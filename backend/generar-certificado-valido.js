/**
 * Script para generar certificados HTTPS válidos usando mkcert
 * Esto permite HTTPS sin advertencias en todos los ordenadores
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const certPath = path.join(__dirname, 'certificates');
const certFile = path.join(certPath, 'server.crt');
const keyFile = path.join(certPath, 'server.key');

// Obtener IPs locales
function getLocalIPs() {
    const networkInterfaces = os.networkInterfaces();
    const ips = ['localhost', '127.0.0.1', '::1'];
    
    Object.keys(networkInterfaces).forEach((interfaceName) => {
        networkInterfaces[interfaceName].forEach((iface) => {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
            }
        });
    });
    
    // Agregar IP pública conocida
    ips.push('92.186.17.227');
    
    return [...new Set(ips)]; // Eliminar duplicados
}

function checkMkcertInstalled() {
    try {
        execSync('mkcert -version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function installMkcertCA() {
    try {
        console.log('🔐 Instalando CA root de mkcert...');
        execSync('mkcert -install', { stdio: 'inherit' });
        console.log('✅ CA root instalada correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error instalando CA root:', error.message);
        return false;
    }
}

function generateCertWithMkcert() {
    try {
        // Crear directorio de certificados
        if (!fs.existsSync(certPath)) {
            fs.mkdirSync(certPath, { recursive: true });
        }

        const ips = getLocalIPs();
        const domains = ips.join(' ');
        
        console.log('🔐 Generando certificado con mkcert...');
        console.log(`   Dominios/IPs: ${domains}`);
        
        // Generar certificado
        const command = `mkcert -key-file "${keyFile}" -cert-file "${certFile}" ${domains}`;
        execSync(command, { stdio: 'inherit', cwd: certPath });
        
        console.log('✅ Certificado generado exitosamente');
        console.log(`📁 Certificado: ${certFile}`);
        console.log(`🔑 Clave privada: ${keyFile}`);
        console.log('\n⚠️  IMPORTANTE: Instala la CA root en cada ordenador cliente');
        console.log('   Ejecuta: mkcert -install');
        console.log('   O copia el archivo rootCA.pem y instálalo manualmente');
        
        return true;
    } catch (error) {
        console.error('❌ Error generando certificado:', error.message);
        return false;
    }
}

function main() {
    console.log('🔐 Generador de Certificados HTTPS Válidos\n');
    
    // Verificar si mkcert está instalado
    if (!checkMkcertInstalled()) {
        console.log('❌ mkcert no está instalado');
        console.log('\n📦 Instalación de mkcert:');
        console.log('   Windows (con Chocolatey): choco install mkcert');
        console.log('   Windows (manual):');
        console.log('     1. Descarga desde: https://github.com/FiloSottile/mkcert/releases');
        console.log('     2. Extrae mkcert-v*-windows-amd64.exe');
        console.log('     3. Renómbralo a mkcert.exe');
        console.log('     4. Colócalo en una carpeta del PATH o en el directorio actual');
        console.log('\n   Linux/Mac:');
        console.log('     brew install mkcert  (Mac)');
        console.log('     apt install mkcert  (Debian/Ubuntu)');
        return;
    }
    
    console.log('✅ mkcert está instalado\n');
    
    // Instalar CA root
    if (!installMkcertCA()) {
        console.log('\n⚠️  No se pudo instalar la CA root automáticamente');
        console.log('   Instálala manualmente ejecutando: mkcert -install');
    }
    
    // Generar certificado
    if (generateCertWithMkcert()) {
        console.log('\n✅ Certificado generado correctamente');
        console.log('\n📋 PRÓXIMOS PASOS:');
        console.log('   1. En cada ordenador cliente, ejecuta: mkcert -install');
        console.log('   2. O distribuye el archivo rootCA.pem e instálalo manualmente');
        console.log('   3. Reinicia el servidor backend');
    }
}

main();


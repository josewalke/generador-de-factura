const fs = require('fs');
const path = require('path');

// Leer package.json
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Obtener versión actual
const currentVersion = packageJson.version || '1.0.0';
const versionParts = currentVersion.split('.');

// Incrementar el build number (último número)
// Formato: major.minor.build
// Ejemplo: 1.0.0 -> 1.0.1 -> 1.0.2
let major = parseInt(versionParts[0]) || 1;
let minor = parseInt(versionParts[1]) || 0;
let build = parseInt(versionParts[2]) || 0;

// Incrementar build number
build++;

// Nueva versión
const newVersion = `${major}.${minor}.${build}`;

// Actualizar package.json
packageJson.version = newVersion;

// Guardar package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`✅ Versión incrementada: ${currentVersion} -> ${newVersion}`);
console.log(`📦 Nueva versión: ${newVersion}`);

// Exportar la nueva versión para uso en scripts
process.stdout.write(newVersion);



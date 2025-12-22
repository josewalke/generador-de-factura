const toIco = require('to-ico');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertPngToIco() {
  const inputPath = path.join(__dirname, 'assets', 'icon.png');
  const outputPath = path.join(__dirname, 'assets', 'icon.ico');
  
  try {
    console.log('🔄 Convirtiendo PNG a ICO...');
    
    // Redimensionar el PNG a diferentes tamaños para el ICO
    // Incluimos tamaños más grandes para que el icono se vea mejor en Windows
    // Windows usa hasta 256x256 como máximo estándar, pero incluimos todos los tamaños comunes
    const sizes = [16, 32, 48, 64, 128, 256];
    const buffers = [];
    
    for (const size of sizes) {
      const buffer = await sharp(inputPath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      buffers.push(buffer);
    }
    
    // Convertir a ICO
    const icoBuffer = await toIco(buffers);
    
    // Guardar el archivo ICO
    fs.writeFileSync(outputPath, icoBuffer);
    
    console.log('✅ Icono convertido exitosamente: assets/icon.ico');
    console.log(`   Tamaños incluidos: ${sizes.join(', ')}px`);
  } catch (error) {
    console.error('❌ Error al convertir:', error.message);
    process.exit(1);
  }
}

convertPngToIco();


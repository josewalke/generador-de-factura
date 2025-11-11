const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Reiniciando servidor backend...');

// Matar procesos de Node.js existentes
const killNode = spawn('taskkill', ['/F', '/IM', 'node.exe'], { 
    shell: true,
    stdio: 'inherit'
});

killNode.on('close', (code) => {
    console.log(`✅ Procesos Node.js terminados (código: ${code})`);
    
    // Esperar un momento y luego iniciar el servidor
    setTimeout(() => {
        console.log('🚀 Iniciando servidor backend...');
        
        const server = spawn('node', ['server.js'], {
            cwd: __dirname,
            stdio: 'inherit',
            shell: true
        });
        
        server.on('error', (err) => {
            console.error('❌ Error iniciando servidor:', err);
        });
        
        server.on('close', (code) => {
            console.log(`📡 Servidor terminado (código: ${code})`);
        });
        
    }, 2000);
});



// Script para crear la base de datos en PostgreSQL
const { Client } = require('pg');
const config = require('./config/config');

const pgConfig = {
    host: config.get('database.host') || 'localhost',
    port: config.get('database.port') || 5432,
    user: config.get('database.user') || 'postgres',
    password: config.get('database.password') || '',
    database: 'postgres' // Conectarse a la BD por defecto para crear la nueva
};

const dbName = config.get('database.database') || 'telwagen';

async function crearBaseDatos() {
    const client = new Client(pgConfig);
    
    try {
        console.log('\n🐘 Conectando a PostgreSQL...');
        console.log(`   Host: ${pgConfig.host}:${pgConfig.port}`);
        console.log(`   User: ${pgConfig.user}`);
        
        await client.connect();
        console.log('✅ Conectado a PostgreSQL\n');
        
        // Verificar si la base de datos ya existe
        const result = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [dbName]
        );
        
        if (result.rows.length > 0) {
            console.log(`✅ La base de datos '${dbName}' ya existe`);
        } else {
            console.log(`📦 Creando base de datos '${dbName}'...`);
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Base de datos '${dbName}' creada exitosamente`);
        }
        
        console.log('\n✅ Todo listo! Ahora puedes ejecutar la migración:');
        console.log('   npm run migrate:postgresql\n');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.message.includes('password authentication failed')) {
            console.error('   Verifica la contraseña en el archivo .env');
        } else if (error.message.includes('does not exist')) {
            console.error('   Verifica que PostgreSQL esté ejecutándose');
        }
        process.exit(1);
    } finally {
        await client.end();
    }
}

crearBaseDatos();


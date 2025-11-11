// Script para eliminar y recrear la tabla empresas con el esquema correcto
const { Pool } = require('pg');
const config = require('./config/config');

const pgConfig = {
    host: config.get('database.host') || 'localhost',
    port: config.get('database.port') || 5432,
    database: config.get('database.database') || 'telwagen',
    user: config.get('database.user') || 'postgres',
    password: config.get('database.password') || ''
};

async function limpiarTabla() {
    const pool = new Pool(pgConfig);
    
    try {
        console.log('Eliminando tabla empresas si existe...');
        await pool.query('DROP TABLE IF EXISTS empresas CASCADE');
        console.log('✅ Tabla eliminada');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

limpiarTabla();


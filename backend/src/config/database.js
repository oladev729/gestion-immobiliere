const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD || '0000',
    port: process.env.DB_PORT || 5432,
});

// Test de connexion
pool.on('connect', () => {
    // console.log('🐘 PostgreSQL : Connecté avec succès');
});

pool.on('error', (err) => {
    console.error('❌ Erreur PostgreSQL inattendue :', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
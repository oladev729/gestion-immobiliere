const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
});

// Test de connexion
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ Erreur de connexion à PostgreSQL:', err.stack);
    }
    console.log('✅ Connecté à PostgreSQL avec succès !');
    release();
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
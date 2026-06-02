const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function cleanDuplicates() {
    try {
        console.log('🧹 Nettoyage des biens dupliqués...');
        
        // Supprimer tous les biens dont l'id_bien est inférieur à 28
        // afin de ne garder que le dernier bien (celui avec l'image)
        const result = await pool.query('DELETE FROM bien WHERE id_bien < 28 RETURNING id_bien, titre');
        console.log(`✅ Supprimé ${result.rowCount} biens dupliqués.`);
        
        const remaining = await pool.query('SELECT id_bien, titre FROM bien');
        console.log('🏠 Biens restants :', remaining.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

cleanDuplicates();

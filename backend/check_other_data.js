const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function checkData() {
    try {
        console.log('=== Lier ouche@gmail.com au locataire 4 ===');
        const updateResult = await pool.query(`
            UPDATE locataire
            SET id_utilisateur = 10
            WHERE id_locataire = 4
            RETURNING *
        `);
        console.log('Locataire mis à jour:', updateResult.rows);

        console.log('\n=== Vérification après mise à jour ===');
        const verifyResult = await pool.query(`
            SELECT l.id_locataire, l.id_utilisateur, u.email
            FROM locataire l
            LEFT JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            WHERE l.id_locataire = 4
        `);
        console.log('Locataire 4 après mise à jour:', verifyResult.rows);

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await pool.end();
    }
}

checkData();

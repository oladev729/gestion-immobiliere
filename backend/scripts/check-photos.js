const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function checkPhotos() {
    try {
        console.log('--- BIENS ---');
        const biens = await pool.query('SELECT id_bien, titre, statut FROM bien');
        console.log(biens.rows);

        console.log('--- PHOTOSBIEN ---');
        const photos = await pool.query('SELECT * FROM photosbien');
        console.log(photos.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkPhotos();

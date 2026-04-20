const db = require('./src/config/database');

async function createProprietaire() {
    try {
        const result = await db.query('INSERT INTO proprietaire (id_utilisateur) VALUES ($1) RETURNING id_proprietaire', [1]);
        console.log('Entrée proprietaire créée:', result.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error('Erreur:', err);
        process.exit(1);
    }
}

createProprietaire();

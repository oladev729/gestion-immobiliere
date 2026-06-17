const db = require('./src/config/database');

async function checkBiens() {
    try {
        const result = await db.query('SELECT id_bien, titre FROM bien ORDER BY id_bien');
        console.log('Biens disponibles:');
        result.rows.forEach(b => {
            console.log(`ID: ${b.id_bien}, Titre: ${b.titre}`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Erreur:', err);
        process.exit(1);
    }
}

checkBiens();

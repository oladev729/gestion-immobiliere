const db = require('./src/config/database');

async function checkAyath() {
    try {
        const user = await db.query("SELECT * FROM utilisateur WHERE nom ILIKE 'OUCHE' OR prenoms ILIKE 'Ayath'");
        console.log('--- Utilisateur ---');
        console.table(user.rows);

        if (user.rows.length > 0) {
            const loc = await db.query("SELECT * FROM locataire WHERE id_utilisateur = $1", [user.rows[0].id_utilisateur]);
            console.log('--- Locataire ---');
            console.table(loc.rows);
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkAyath();

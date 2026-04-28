const db = require('./src/config/database');

async function checkPropMapping() {
    try {
        const props = await db.query("SELECT p.id_proprietaire, u.id_utilisateur, u.email, u.nom FROM proprietaire p JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur");
        console.log('--- Mappage Propriétaire ---');
        console.table(props.rows);

        const locs = await db.query("SELECT l.id_locataire, u.id_utilisateur, u.email, u.nom FROM locataire l JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur");
        console.log('--- Mappage Locataire ---');
        console.table(locs.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkPropMapping();

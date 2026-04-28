const db = require('./src/config/database');

async function checkLastDemande() {
    try {
        const lastDemande = await db.query(`
            SELECT d.*, b.titre as bien_titre, 
                   up.nom as prop_nom, up.prenoms as prop_prenoms, up.id_utilisateur as prop_user_id
            FROM demander_visite d
            JOIN bien b ON d.id_bien = b.id_bien
            JOIN proprietaire p ON d.id_proprietaire = p.id_proprietaire
            JOIN utilisateur up ON p.id_utilisateur = up.id_utilisateur
            ORDER BY d.date_demande DESC LIMIT 1
        `);
        console.log('--- Dernière Demande de Visite ---');
        console.table(lastDemande.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkLastDemande();

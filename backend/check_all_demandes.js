const db = require('./src/config/database');

async function checkAllDemandes() {
    try {
        console.log('--- Toutes les demandes de visite ---');
        const res = await db.query(`
            SELECT dv.id_demande, dv.id_bien, b.titre, 
                   dv.id_proprietaire as prop_pk, up.nom as prop_nom, up.id_utilisateur as prop_user_id,
                   dv.id_locataire as loc_pk, ul.nom as loc_nom, ul.id_utilisateur as loc_user_id
            FROM demander_visite dv
            JOIN bien b ON dv.id_bien = b.id_bien
            JOIN proprietaire p ON dv.id_proprietaire = p.id_proprietaire
            JOIN utilisateur up ON p.id_utilisateur = up.id_utilisateur
            JOIN locataire l ON dv.id_locataire = l.id_locataire
            JOIN utilisateur ul ON l.id_utilisateur = ul.id_utilisateur
        `);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkAllDemandes();

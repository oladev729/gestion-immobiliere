const db = require('./src/config/database');

async function superRepair() {
    try {
        console.log('🚀 Démarrage de la grande maintenance de la base de données...');

        // 1. Supprimer les entrées orphelines (id_utilisateur est NULL) sans dépendances critiques
        // Note: On a vu que l'id_locataire 4 avait un id_utilisateur NULL mais était utilisé. 
        // On va essayer de trouver à qui appartiennent les orphelins si possible, sinon on nettoie.
        const orphelinsLoc = await db.query("SELECT id_locataire FROM locataire WHERE id_utilisateur IS NULL");
        console.log(`🔍 Trouvé ${orphelinsLoc.rows.length} profils locataires orphelins.`);

        // 2. S'assurer que chaque utilisateur 'locataire' a une entrée dans la table locataire
        const usersLoc = await db.query("SELECT id_utilisateur, email FROM utilisateur WHERE type_utilisateur = 'locataire'");
        for (const user of usersLoc.rows) {
            const exists = await db.query("SELECT id_locataire FROM locataire WHERE id_utilisateur = $1", [user.id_utilisateur]);
            if (exists.rows.length === 0) {
                console.log(`🔧 Création du profil locataire manquant pour ${user.email} (ID: ${user.id_utilisateur})`);
                await db.query(
                    "INSERT INTO locataire (id_utilisateur, compte_confirme, email_invite) VALUES ($1, $2, $3)",
                    [user.id_utilisateur, true, user.email]
                );
            }
        }

        // 3. S'assurer que chaque utilisateur 'proprietaire' a une entrée dans la table proprietaire
        const usersProp = await db.query("SELECT id_utilisateur, email FROM utilisateur WHERE type_utilisateur = 'proprietaire'");
        for (const user of usersProp.rows) {
            const exists = await db.query("SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1", [user.id_utilisateur]);
            if (exists.rows.length === 0) {
                console.log(`🔧 Création du profil propriétaire manquant pour ${user.email} (ID: ${user.id_utilisateur})`);
                await db.query(
                    "INSERT INTO proprietaire (id_utilisateur) VALUES ($1)",
                    [user.id_utilisateur]
                );
            }
        }

        // 4. Nettoyer les doublons (plusieurs profils pour un même utilisateur)
        await db.query(`
            DELETE FROM locataire a USING locataire b 
            WHERE a.id_locataire < b.id_locataire 
            AND a.id_utilisateur = b.id_utilisateur
        `);
        
        await db.query(`
            DELETE FROM proprietaire a USING proprietaire b 
            WHERE a.id_proprietaire < b.id_proprietaire 
            AND a.id_utilisateur = b.id_utilisateur
        `);

        // 5. Vérifier la cohérence des contrats (id_locataire et id_bien valides)
        const contratsInvalides = await db.query(`
            SELECT id_contact FROM contact 
            WHERE id_locataire NOT IN (SELECT id_locataire FROM locataire)
            OR id_bien NOT IN (SELECT id_bien FROM bien)
        `);
        if (contratsInvalides.rows.length > 0) {
            console.log(`⚠️ Attention: ${contratsInvalides.rows.length} contrats pointent vers des données inexistantes.`);
        }

        console.log('✅ Maintenance terminée avec succès !');

    } catch (err) {
        console.error('❌ Erreur lors de la maintenance:', err);
    } finally {
        process.exit();
    }
}

superRepair();

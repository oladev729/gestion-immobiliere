const db = require('./src/config/database');

async function repairAyath() {
    try {
        console.log('🛠️ Réparation forcée du compte Ayath (ID 10)...');
        
        // Supprimer d'éventuelles lignes corrompues (id_utilisateur is null)
        await db.query("DELETE FROM locataire WHERE id_utilisateur IS NULL");
        
        // Insérer le profil correct
        await db.query(
            "INSERT INTO locataire (id_utilisateur, compte_confirme, email_invite) VALUES (10, true, 'ouche@gmail.com') ON CONFLICT DO NOTHING"
        );
        
        console.log('✅ Base de données réparée pour Ayath OUCHE.');
        
        const finalCheck = await db.query("SELECT * FROM locataire WHERE id_utilisateur = 10");
        console.table(finalCheck.rows);
    } catch (err) {
        console.error('❌ Erreur lors de la réparation:', err);
    } finally {
        process.exit();
    }
}

repairAyath();

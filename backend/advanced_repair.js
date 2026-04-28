const db = require('./src/config/database');

async function advancedRepair() {
    try {
        console.log('🛠️ Réparation avancée : liaison du profil orphelin à Ayath...');
        
        // Mettre à jour le locataire ID 4 (qui a un utilisateur NULL mais un contrat) pour qu'il appartienne à Ayath (ID 10)
        await db.query(
            "UPDATE locataire SET id_utilisateur = 10, email_invite = 'ouche@gmail.com', compte_confirme = true WHERE id_locataire = 4"
        );
        
        console.log('✅ Profil lié avec succès.');
        
        const finalCheck = await db.query("SELECT * FROM locataire WHERE id_locataire = 4");
        console.table(finalCheck.rows);
    } catch (err) {
        console.error('❌ Erreur lors de la réparation:', err);
    } finally {
        process.exit();
    }
}

advancedRepair();

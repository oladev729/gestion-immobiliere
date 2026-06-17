const db = require('./src/config/database');

async function checkAllOwnerLinks() {
    try {
        console.log('🔍 Vérification de tous les liens propriétaire-utilisateur...');
        
        // Get all owners
        const owners = await db.query('SELECT * FROM proprietaire ORDER BY id_proprietaire');
        console.log(`👔 Total propriétaires: ${owners.rows.length}`);
        
        for (const owner of owners.rows) {
            console.log(`\n👔 Propriétaire ID: ${owner.id_proprietaire}`);
            console.log(`   User ID: ${owner.id_utilisateur}`);
            
            if (owner.id_utilisateur) {
                // Check if user exists
                const user = await db.query('SELECT email FROM utilisateur WHERE id_utilisateur = $1', [owner.id_utilisateur]);
                if (user.rows.length > 0) {
                    console.log(`   ✅ Lié à l'utilisateur: ${user.rows[0].email}`);
                } else {
                    console.log(`   ❌ User ID ${owner.id_utilisateur} n'existe pas dans la table utilisateur`);
                }
            } else {
                console.log(`   ❌ Aucun utilisateur lié`);
            }
        }
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
}

checkAllOwnerLinks();
